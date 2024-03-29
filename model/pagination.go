package model

import (
	"net/http"
	"strconv"
)

const (
	_defaultPageNum  = 0
	_defaultPageSize = 18
)

type Pagination struct {
	Page int
	Size int
}

func (p *Pagination) Offset() int {
	if p.Page < 0 {
		p.Page = _defaultPageNum
	}

	if p.Limit() < 0 {
		return p.Page
	}

	return p.Page * p.Limit()
}

func (p *Pagination) Limit() int {
	if p.Size <= 0 {
		return _defaultPageSize
	}

	return p.Size
}

func GetPagination(r *http.Request) *Pagination {
	pageNum, _ := strconv.Atoi(r.URL.Query().Get("page"))
	pageSize, _ := strconv.Atoi(r.URL.Query().Get("size"))
	if pageSize > 1000 {
		pageSize = 1000
	}
	return &Pagination{Page: pageNum, Size: pageSize}
}
