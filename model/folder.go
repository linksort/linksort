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

// GetDepth returns the depth of a folder in the tree.
// Returns -1 if the folder is not found.
// The root folder has depth 0, its children have depth 1, etc.
func (f *Folder) GetDepth(id string) int {
	type queueItem struct {
		folder *Folder
		depth  int
	}

	queue := []queueItem{{folder: f, depth: 0}}

	for len(queue) > 0 {
		item := queue[0]
		queue = queue[1:]

		if item.folder.ID == id {
			return item.depth
		}

		for _, child := range item.folder.Children {
			queue = append(queue, queueItem{folder: child, depth: item.depth + 1})
		}
	}

	return -1
}

// CountTopLevelFolders returns the number of direct children of this folder.
func (f *Folder) CountTopLevelFolders() int {
	return len(f.Children)
}

// GetMaxDepthOfSubtree returns the maximum depth of the subtree rooted at this folder.
// A folder with no children has a max depth of 0.
// A folder with children has max depth = 1 + max(child depths).
func (f *Folder) GetMaxDepthOfSubtree() int {
	if len(f.Children) == 0 {
		return 0
	}

	maxChildDepth := 0
	for _, child := range f.Children {
		childDepth := child.GetMaxDepthOfSubtree()
		if childDepth > maxChildDepth {
			maxChildDepth = childDepth
		}
	}

	return 1 + maxChildDepth
}
