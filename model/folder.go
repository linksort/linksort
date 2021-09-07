package model

import "github.com/linksort/linksort/random"

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
