package model

import "strings"

type UserTags map[string]int

func NewUserTags() UserTags {
	return make(UserTags)
}

func (ut UserTags) Add(tag string) {
	cleaned := strings.TrimSpace(tag)
	if len(cleaned) == 0 {
		return
	}

	ut[cleaned]++
}

func (ut UserTags) Remove(tag string) {
	cleaned := strings.TrimSpace(tag)
	if len(cleaned) == 0 {
		return
	}

	if _, ok := ut[cleaned]; ok {
		ut[cleaned]--

		if ut[cleaned] == 0 {
			delete(ut, cleaned)
		}
	}
}

func (ut UserTags) Has(tag string) bool {
	_, ok := ut[tag]
	return ok
}

func (ut UserTags) UpdateWithAddedTags(tags []string) {
	for _, tag := range tags {
		ut.Add(tag)
	}
}

func (ut UserTags) UpdateWithRemovedTags(tags []string) {
	for _, tag := range tags {
		ut.Remove(tag)
	}
}

func GetAddedAndRemovedTags(oldTags, newTags []string) (added, removed []string) {
	added = make([]string, 0)
	removed = make([]string, 0)

	for _, tag := range oldTags {
		if !contains(newTags, tag) {
			removed = append(removed, tag)
		}
	}

	for _, tag := range newTags {
		if !contains(oldTags, tag) {
			added = append(added, tag)
		}
	}

	return
}

func ReconcileUserTags(u *User, oldTags, newTags []string) {
	added, removed := GetAddedAndRemovedTags(oldTags, newTags)
	u.UserTags.UpdateWithAddedTags(added)
	u.UserTags.UpdateWithRemovedTags(removed)
}

func contains(tags []string, tag string) bool {
	for _, t := range tags {
		if t == tag {
			return true
		}
	}

	return false
}
