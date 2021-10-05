const { extendTheme } = require("@chakra-ui/react")
const { createBreakpoints } = require("@chakra-ui/theme-tools")

const theme = require("../../../theme/theme.js")

module.exports = extendTheme({
  ...theme,
  breakpoints: createBreakpoints(theme.breakpoints),
})
