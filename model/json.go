package model

import "encoding/json"

type JSONStringArray []string

func (j *JSONStringArray) MarshalJSON() ([]byte, error) {
	if len(*j) == 0 {
		return []byte("[]"), nil
	}

	return json.Marshal([]string(*j))
}
