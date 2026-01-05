package model

import "testing"

func TestFolderCount(t *testing.T) {
	root := &Folder{Name: "root", ID: "root"}
	child := NewFolder("child", root)
	NewFolder("grandchild", child)

	if got, want := root.Count(), 3; got != want {
		t.Fatalf("unexpected folder count: got %d want %d", got, want)
	}
}
