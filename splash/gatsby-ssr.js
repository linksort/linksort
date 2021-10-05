const React = require("react")

exports.onPreRenderHTML = ({ getHeadComponents, replaceHeadComponents }) => {
  replaceHeadComponents(
    [
      <link
        key="inter"
        rel="stylesheet"
        href="https://unpkg.com/@fontsource/inter@4.1.0/latin.css"
      />,
      <link
        key="source-serif-pro"
        rel="stylesheet"
        href="https://unpkg.com/@fontsource/source-serif-pro@4.1.0/latin.css"
      />,
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
