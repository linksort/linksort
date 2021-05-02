package integ_test

import (
	"os"
	"testing"

	"github.com/linksort/linksort/testutil"
)

func TestMain(m *testing.M) {
	_ = testutil.Handler()
	result := m.Run()

	testutil.CleanUp()
	os.Exit(result)
}
