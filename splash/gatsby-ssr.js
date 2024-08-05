const React = require("react")

exports.onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents }) => {
  replaceHeadComponents(
    [
      <script
        async
        defer
        data-domain="linksort.com"
        src="https://plausible.io/js/plausible.js"
        key="plausible"
      />,
    ].concat(getHeadComponents())
  )
}
