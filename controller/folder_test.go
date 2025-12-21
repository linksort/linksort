package controller

import (
	"context"
	"fmt"
	"net/http"
	"testing"

	"github.com/linksort/linksort/errors"
	handler "github.com/linksort/linksort/handler/folder"
	"github.com/linksort/linksort/model"
)

type mockUserStore struct {
	updateUserFunc func(context.Context, *model.User) (*model.User, error)
	updateCalled   bool
}

func (m *mockUserStore) GetUserBySessionID(context.Context, string) (*model.User, error) {
	return nil, errors.Str("not implemented")
}
func (m *mockUserStore) GetUserByToken(context.Context, string) (*model.User, error) {
	return nil, errors.Str("not implemented")
}
func (m *mockUserStore) GetUserByEmail(context.Context, string) (*model.User, error) {
	return nil, errors.Str("not implemented")
}
func (m *mockUserStore) CreateUser(context.Context, *model.User) (*model.User, error) {
	return nil, errors.Str("not implemented")
}
func (m *mockUserStore) DeleteUser(context.Context, *model.User) error {
	return errors.Str("not implemented")
}

func (m *mockUserStore) UpdateUser(ctx context.Context, u *model.User) (*model.User, error) {
	m.updateCalled = true
	if m.updateUserFunc != nil {
		return m.updateUserFunc(ctx, u)
	}

	return u, nil
}

func TestCreateFolder_LimitReached(t *testing.T) {
	ctx := context.Background()
	usr := &model.User{FolderTree: &model.Folder{Name: "root", ID: "root"}}

	for i := 0; i < maxFolderCount-1; i++ {
		model.NewFolder(fmt.Sprintf("folder-%d", i), usr.FolderTree)
	}

	store := &mockUserStore{}
	controller := Folder{Store: store}

	_, err := controller.CreateFolder(ctx, usr, &handler.CreateFolderRequest{Name: "too-many"})
	if err == nil {
		t.Fatal("expected an error when exceeding folder limit")
	}

	var e *errors.Error
	if !errors.As(err, &e) {
		t.Fatalf("expected errors.Error, got %T", err)
	}

	if status := e.Status(); status != http.StatusBadRequest {
		t.Fatalf("unexpected status: got %d want %d", status, http.StatusBadRequest)
	}

	if msg := e.Message()["message"]; msg == "" {
		t.Fatal("expected user-facing message")
	}

	if got := usr.FolderTree.Count(); got != maxFolderCount {
		t.Fatalf("folder tree changed despite limit: got %d want %d", got, maxFolderCount)
	}

	if store.updateCalled {
		t.Fatal("store.UpdateUser should not be called when limit is reached")
	}
}
