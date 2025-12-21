package model

import (
	"testing"
)

func TestGetDepth(t *testing.T) {
	// Create a folder tree for testing
	root := &Folder{
		ID:       "root",
		Name:     "root",
		Children: make([]*Folder, 0),
	}

	level1 := NewFolder("level1", root)
	level2 := NewFolder("level2", level1)
	level3 := NewFolder("level3", level2)
	NewFolder("level1-sibling", root)

	tests := []struct {
		name     string
		folderID string
		expected int
	}{
		{"root has depth 0", "root", 0},
		{"level 1 has depth 1", level1.ID, 1},
		{"level 2 has depth 2", level2.ID, 2},
		{"level 3 has depth 3", level3.ID, 3},
		{"non-existent folder returns -1", "non-existent", -1},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			depth := root.GetDepth(tc.folderID)
			if depth != tc.expected {
				t.Errorf("GetDepth(%s) = %d, expected %d", tc.folderID, depth, tc.expected)
			}
		})
	}
}

func TestCountTopLevelFolders(t *testing.T) {
	root := &Folder{
		ID:       "root",
		Name:     "root",
		Children: make([]*Folder, 0),
	}

	// Initially should have 0 children
	if count := root.CountTopLevelFolders(); count != 0 {
		t.Errorf("Expected 0 top-level folders, got %d", count)
	}

	// Add folders
	NewFolder("folder1", root)
	NewFolder("folder2", root)
	NewFolder("folder3", root)

	if count := root.CountTopLevelFolders(); count != 3 {
		t.Errorf("Expected 3 top-level folders, got %d", count)
	}

	// Add nested folders - shouldn't affect top-level count
	level1 := root.Children[0]
	NewFolder("nested1", level1)
	NewFolder("nested2", level1)

	if count := root.CountTopLevelFolders(); count != 3 {
		t.Errorf("Expected 3 top-level folders after adding nested folders, got %d", count)
	}
}

func TestGetMaxDepthOfSubtree(t *testing.T) {
	tests := []struct {
		name     string
		setup    func() *Folder
		expected int
	}{
		{
			name: "empty folder has depth 0",
			setup: func() *Folder {
				return &Folder{ID: "test", Name: "test", Children: make([]*Folder, 0)}
			},
			expected: 0,
		},
		{
			name: "folder with one child has depth 1",
			setup: func() *Folder {
				root := &Folder{ID: "root", Name: "root", Children: make([]*Folder, 0)}
				NewFolder("child", root)
				return root
			},
			expected: 1,
		},
		{
			name: "folder with nested children has correct depth",
			setup: func() *Folder {
				root := &Folder{ID: "root", Name: "root", Children: make([]*Folder, 0)}
				level1 := NewFolder("level1", root)
				level2 := NewFolder("level2", level1)
				NewFolder("level3", level2)
				return root
			},
			expected: 3,
		},
		{
			name: "folder with multiple branches returns max depth",
			setup: func() *Folder {
				root := &Folder{ID: "root", Name: "root", Children: make([]*Folder, 0)}

				// Branch 1: depth 2
				branch1 := NewFolder("branch1", root)
				NewFolder("branch1-child", branch1)

				// Branch 2: depth 4 (this should be the max)
				branch2 := NewFolder("branch2", root)
				b2l2 := NewFolder("b2-l2", branch2)
				b2l3 := NewFolder("b2-l3", b2l2)
				NewFolder("b2-l4", b2l3)

				// Branch 3: depth 1
				NewFolder("branch3", root)

				return root
			},
			expected: 4,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			folder := tc.setup()
			depth := folder.GetMaxDepthOfSubtree()
			if depth != tc.expected {
				t.Errorf("GetMaxDepthOfSubtree() = %d, expected %d", depth, tc.expected)
			}
		})
	}
}
