package model

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/linksort/analyze"
	"github.com/linksort/linksort/errors"
)

var ErrCallOnNonRootNode = errors.Str("call on non-root node")

const _root = "root"

type TagDetail struct {
	Name       string  `json:"name"`
	Path       string  `json:"path"`
	Confidence float32 `json:"confidence"`
}

func ParseTagDetails(tt []*analyze.Tag) []*TagDetail {
	out := make([]*TagDetail, len(tt))

	for i, t := range tt {
		out[i] = &TagDetail{
			Name:       getNameFromPath(t.Name),
			Path:       t.Name,
			Confidence: t.Confidence,
		}
	}

	return out
}

func ParseTagDetailsToPathList(tt []*analyze.Tag) []string {
	book := make(map[string]bool)

	for _, t := range tt {
		for _, n := range getPathSegments(t.Name) {
			book[n] = true
		}
	}

	out := make([]string, 0)

	for k := range book {
		out = append(out, k)
	}

	return out
}

type TagDetailList []*TagDetail

func (j *TagDetailList) MarshalJSON() ([]byte, error) {
	if len(*j) == 0 {
		return []byte("[]"), nil
	}

	return json.Marshal([]*TagDetail(*j))
}

type TagNode struct {
	Name     string     `json:"name"`
	Path     string     `json:"path"`
	Count    int        `json:"count"`
	Children []*TagNode `json:"children"`
}

func (n *TagNode) UpdateWithNewTagDetails(l TagDetailList) error {
	if n.Path != _root {
		// nolint
		return ErrCallOnNonRootNode
	}

	for _, t := range l {
		n.incrementOrCreateByTagDetail(t)
	}

	return nil
}

func (n *TagNode) UpdateWithDeletedTagDetails(l TagDetailList) error {
	if n.Path != _root {
		// nolint
		return ErrCallOnNonRootNode
	}

	for _, t := range l {
		n.decrementOrDeleteByTagDetail(t)
	}

	return nil
}

func (n *TagNode) incrementOrCreateByTagDetail(t *TagDetail) {
	paths := getPathSegments(t.Path)

	for depth, path := range paths {
		var (
			parentPath string
			found      *TagNode
		)

		if depth == 0 {
			parentPath = _root
		} else {
			parentPath = paths[depth-1]
		}

		found = nil
		currentNode := n.FindByPathname(parentPath)

		for _, child := range currentNode.Children {
			if child.Path == path {
				found = child

				break
			}
		}

		if found == nil {
			currentNode.Children = append(currentNode.Children, &TagNode{
				Name:     getNameFromPath(path),
				Path:     path,
				Count:    1,
				Children: make([]*TagNode, 0),
			})
		} else {
			found.Count++
		}
	}
}

func (n *TagNode) decrementOrDeleteByTagDetail(t *TagDetail) {
	paths := getPathSegments(t.Path)

	fmt.Printf("%#v\n", paths)

	for depth, path := range paths {
		var (
			parentPath string
			found      *TagNode
		)

		if depth == 0 {
			parentPath = _root
		} else {
			parentPath = paths[depth-1]
		}

		fmt.Printf("%#v\n", parentPath)

		found = nil
		currentNode := n.FindByPathname(parentPath)

		if currentNode == nil {
			continue
		}

		for _, child := range currentNode.Children {
			if child.Path == path {
				found = child

				break
			}
		}

		if found != nil {
			found.Count--

			if found.Count <= 0 {
				currentNode.RemoveChildByPathname(found.Path)
			}
		}
	}
}

func (n *TagNode) FindByPathname(path string) *TagNode {
	if n.Path == path {
		return n
	}

	for _, child := range n.Children {
		if res := child.FindByPathname(path); res != nil {
			return res
		}
	}

	return nil
}

func (n *TagNode) RemoveChildByPathname(path string) *TagNode {
	for i, child := range n.Children {
		if child.Path == path {
			n.Children = append(n.Children[:i], n.Children[i+1:]...)

			break
		}
	}

	return n
}

func getNameFromPath(s string) string {
	ss := strings.Split(s, "/")

	return ss[len(ss)-1]
}

func getPathSegments(s string) []string {
	ss := strings.Split(s, "/")

	if len(ss) > 0 && ss[0] == "" {
		ss = ss[1:]
	}

	out := make([]string, 0)
	for i := range ss {
		out = append(out, strings.Join(ss[0:i+1], "/"))
	}

	return out
}
