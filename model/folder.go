package model

import (
	"net/http"

	"github.com/linksort/linksort/errors"
	"github.com/linksort/linksort/random"
)

type Folder struct {
	Name     string    `json:"name"`
	ID       string    `json:"id"`
	Children []*Folder `json:"children"`
}

func NewFolder(name string, parent *Folder) *Folder {
	newFolder := &Folder{
		Name:     name,
		ID:       random.UUID(),
		Children: make([]*Folder, 0),
	}

	if parent != nil {
		parent.Children = append(parent.Children, newFolder)
	}

	return newFolder
}

func (f *Folder) FindByName(name string) *Folder {
	if f.Name == name {
		return f
	}

	for _, child := range f.Children {
		if res := child.FindByName(name); res != nil {
			return res
		}
	}

	return nil
}

func (f *Folder) DFS(id string) *Folder {
	if f.ID == id {
		return f
	}

	for _, child := range f.Children {
		if res := child.DFS(id); res != nil {
			return res
		}
	}

	return nil
}

func (f *Folder) BFS(id string) *Folder {
	queue := []*Folder{f}

	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]

		if node.ID == id {
			return node
		}

		queue = append(queue, node.Children...)
	}

	return nil
}

func (f *Folder) Walk(callback func(parent, node *Folder) bool) {
	queue := []*Folder{f}

	for len(queue) > 0 {
		parent := queue[0]
		queue = queue[1:]

		for _, child := range parent.Children {
			if !callback(parent, child) {
				return
			}
		}

		queue = append(queue, parent.Children...)
	}
}

func (f *Folder) Move(from, to string, idx int) error {
	op := errors.Opf("folder.Move(%s, %s, %d)", from, to, idx)

	found := f.Remove(from)
	if found == nil {
		return errors.E(
			op,
			errors.Str("from folder not found"),
			errors.M{"message": "The origin folder was not found."},
			http.StatusBadRequest)
	}

	dest := f.BFS(to)
	if dest == nil {
		return errors.E(
			op,
			errors.Str("to folder not found"),
			errors.M{"message": "The destination folder was not found."},
			http.StatusBadRequest)
	}

	if idx > len(dest.Children) || idx < 0 {
		dest.Children = append(dest.Children, found)
	} else {
		dest.Children = append(append(dest.Children[:idx], found), dest.Children[idx:]...)
	}

	return nil
}

func (f *Folder) Remove(id string) *Folder {
	var found *Folder

	f.Walk(func(parent, node *Folder) bool {
		if node.ID == id {
			found = node

			for i, child := range parent.Children {
				if child.ID == id {
					parent.Children = append(parent.Children[:i], parent.Children[i+1:]...)
				}
			}

			return false
		}

		return true
	})

	return found
}
