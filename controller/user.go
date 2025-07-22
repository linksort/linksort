package controller

import (
	"archive/zip"
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"reflect"
	"strconv"
	"strings"
	"time"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/user"
	"github.com/linksort/linksort/log"
	"github.com/linksort/linksort/model"
	"github.com/linksort/linksort/random"
)

type User struct {
	Store     model.UserStore
	LinkStore interface {
		CreateLink(ctx context.Context, link *model.Link) (*model.Link, error)
		DeleteAllLinksByUser(ctx context.Context, u *model.User) error
		GetAllLinksByUser(ctx context.Context, u *model.User, p *model.Pagination) ([]*model.Link, error)
		GetTotalLinksCountByUser(ctx context.Context, u *model.User) (int, error)
	}
	Email interface {
		SendForgotPassword(context.Context, *model.User, string) error
	}
	Magic interface {
		Link(action, email, salt string) string
		Verify(email, b64ts, salt, sig string, expiry time.Duration) error
	}
}

func (u *User) CreateUser(ctx context.Context, req *handler.CreateUserRequest) (*model.User, error) {
	op := errors.Opf("controller.CreateUser(%q)", req.Email)

	digest, err := model.NewPasswordDigest(req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	usr, err := u.Store.CreateUser(ctx, &model.User{
		Email:          strings.ToLower(req.Email),
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		SessionID:      random.Token(),
		SessionExpiry:  time.Now().Add(time.Hour * time.Duration(24*90)),
		PasswordDigest: digest,
		Token:          random.Token(),
		FolderTree: &model.Folder{
			Name:     "root",
			ID:       "root",
			Children: make([]*model.Folder, 0),
		},
		TagTree: &model.TagNode{
			Name:     "root",
			Path:     "root",
			Count:    0,
			Children: make([]*model.TagNode, 0),
		},
		UserTags: model.NewUserTags(),
	})
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) populateLinksCount(ctx context.Context, usr *model.User) error {
	if usr.LinksCount == 0 {
		count, err := u.LinkStore.GetTotalLinksCountByUser(ctx, usr)
		if err != nil {
			return err
		}
		usr.LinksCount = count
	}
	return nil
}

func (u *User) GetUserBySessionID(ctx context.Context, sessionID string) (*model.User, error) {
	op := errors.Opf("controller.GetUserBySessionID(%q)", sessionID)

	usr, err := u.Store.GetUserBySessionID(ctx, sessionID)
	if err != nil {
		return nil, errors.E(op, err)
	}

	err = u.populateLinksCount(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) GetUserByToken(ctx context.Context, token string) (*model.User, error) {
	op := errors.Opf("controller.GetUserByToken()")

	usr, err := u.Store.GetUserByToken(ctx, token)
	if err != nil {
		return nil, errors.E(op, err)
	}

	err = u.populateLinksCount(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) UpdateUser(ctx context.Context, usr *model.User, req *handler.UpdateUserRequest) (*model.User, error) {
	op := errors.Opf("controller.UpdateUser(%q)", usr.Email)

	uv := reflect.ValueOf(usr).Elem()
	rv := reflect.ValueOf(req).Elem()
	rt := rv.Type()

	for i := 0; i < rv.NumField(); i++ {
		switch rv.Type().Field(i).Name {
		case "HasSeenWelcomeTour":
			if isNil := rv.Field(i).IsNil(); !isNil {
				uv.FieldByName(rt.Field(i).Name).
					Set(reflect.ValueOf(rv.Field(i).Elem().Bool()))
			}
		default:
			if ss := rv.Field(i).String(); ss != "" {
				uv.FieldByName(rt.Field(i).Name).Set(reflect.ValueOf(ss))
			}
		}
	}

	usr, err := u.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) DeleteUser(ctx context.Context, usr *model.User) error {
	op := errors.Opf("controller.DeleteUser(%q)", usr.Email)

	err := u.LinkStore.DeleteAllLinksByUser(ctx, usr)
	if err != nil {
		return errors.E(op, err)
	}

	err = u.Store.DeleteUser(ctx, usr)
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}

func (u *User) ForgotPassword(ctx context.Context, req *handler.ForgotPasswordRequest) error {
	op := errors.Opf("controller.ForgotPassword(%q)", req.Email)

	usr, err := u.Store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		log.FromContext(ctx).Print(errors.E(op, err))

		return nil
	}

	link := u.Magic.Link("change-password", usr.Email, usr.PasswordDigest)

	err = u.Email.SendForgotPassword(ctx, usr, link)
	if err != nil {
		return errors.E(op, err)
	}

	return nil
}

func (u *User) ChangePassword(ctx context.Context, req *handler.ChangePasswordRequest) (*model.User, error) {
	op := errors.Opf("controller.ChangePassword(%q)", req.Email)

	usr, err := u.Store.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.E(op, err, http.StatusUnauthorized)
	}

	if err := u.Magic.Verify(
		usr.Email,
		req.Timestamp,
		usr.PasswordDigest,
		req.Signature,
		time.Hour,
	); err != nil {
		return nil, errors.E(op, err)
	}

	digest, err := model.NewPasswordDigest(req.Password)
	if err != nil {
		return nil, errors.E(op, err)
	}

	usr.PasswordDigest = digest
	usr.RefreshSession()
	usr.Token = random.Token()

	usr, err = u.Store.UpdateUser(ctx, usr)
	if err != nil {
		return nil, errors.E(op, err)
	}

	return usr, nil
}

func (u *User) DownloadUserData(ctx context.Context, usr *model.User, w io.Writer) error {
	op := errors.Opf("controller.DownloadUserData(%q)", u.Email)
	flusher, ok := w.(http.Flusher)
	if !ok {
		return errors.E(op, errors.Strf("expected http.ResponseWriter, got %T", w))
	}
	zipW := zip.NewWriter(w)
	// Write user data to zip file
	userW, err := zipW.CreateHeader(&zip.FileHeader{
		Name:     "user.json",
		Modified: time.Now(),
		Method:   zip.Deflate,
	})
	if err != nil {
		return errors.E(op, err)
	}
	enc := json.NewEncoder(userW)
	enc.Encode(usr)
	flusher.Flush()
	// Write links to zip file
	pagination := &model.Pagination{Page: 0, Size: 500}
	for {
		batch, err := u.LinkStore.GetAllLinksByUser(ctx, usr, pagination)
		if err != nil {
			return errors.E(op, err)
		}
		batchW, err := zipW.CreateHeader(&zip.FileHeader{
			Name:     fmt.Sprintf("links-%d.json", pagination.Page),
			Modified: time.Now(),
			Method:   zip.Deflate,
		})
		if err != nil {
			return errors.E(op, err)
		}
		enc := json.NewEncoder(batchW)
		enc.Encode(batch)
		flusher.Flush()
		if len(batch) < pagination.Size {
			break
		} else {
			pagination.Page++
		}
	}
	zipW.Close()
	flusher.Flush()
	return nil
}

func (u *User) ImportPocket(ctx context.Context, usr *model.User, r io.Reader) (int, error) {
	op := errors.Op("controller.ImportPocket")

	reader := csv.NewReader(r)

	headers, err := reader.Read()
	if err != nil {
		return 0, errors.E(op, err, http.StatusBadRequest)
	}

	idx := map[string]int{}
	for i, h := range headers {
		idx[strings.ToLower(strings.TrimSpace(h))] = i
	}

	count := 0

	user, err := u.Store.GetUserByEmail(ctx, usr.Email)
	if err != nil {
		return 0, errors.E(op, err)
	}

	for {
		rec, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return count, errors.E(op, err)
		}

		url := rec[idx["url"]]
		title := ""
		if i, ok := idx["title"]; ok {
			title = rec[i]
		}
		ts := int64(0)
		if i, ok := idx["time_added"]; ok {
			ts, _ = strconv.ParseInt(rec[i], 10, 64)
		}
		tagsStr := ""
		if i, ok := idx["tags"]; ok {
			tagsStr = rec[i]
		}
		created := time.Unix(ts, 0)
		if ts == 0 {
			created = time.Now()
		}

		tags := make([]string, 0)
		isFav := false
		if tagsStr != "" {
			for _, t := range strings.Split(tagsStr, "|") {
				t = strings.TrimSpace(t)
				if t == "" {
					continue
				}
				if t == "starred" {
					isFav = true
				} else {
					tags = append(tags, t)
					user.UserTags.Add(t)
				}
			}
		}

		link := &model.Link{
			UserID:     usr.ID,
			CreatedAt:  created,
			UpdatedAt:  created,
			URL:        url,
			Title:      title,
			IsFavorite: isFav,
			UserTags:   tags,
		}

		_, err = u.LinkStore.CreateLink(ctx, link)
		if err != nil {
			if e, ok := err.(*errors.Error); ok {
				if e.Status() == http.StatusBadRequest && e.Message()["url"] == "This link has already been saved." {
					// skip duplicates
					continue
				}
			}
			return count, errors.E(op, err)
		}

		count++
	}

	if _, err = u.Store.UpdateUser(ctx, user); err != nil {
		return count, errors.E(op, err)
	}

	return count, nil
}
