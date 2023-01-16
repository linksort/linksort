/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.com/docs/use-static-query/
 */

import React from "react"
import { Helmet } from "react-helmet"
import { useStaticQuery, graphql } from "gatsby"

export default function Metadata({ description = "", title = "" }) {
  const { site } = useStaticQuery(
    graphql`
      query {
        site {
          siteMetadata {
            title
            description
            social {
              twitter
            }
          }
        }
      }
    `
  )

  const defaultTitle = site.siteMetadata?.title
  const metaTitle = title || defaultTitle
  const metaDescription = description || site.siteMetadata.description

  let meta = [
    {
      name: `description`,
      content: metaDescription,
    },
    {
      property: `og:title`,
      content: metaTitle,
    },
    {
      property: `og:description`,
      content: metaDescription,
    },
    {
      property: `og:type`,
      content: `website`,
    },
    {
      name: `twitter:creator`,
      content: site.siteMetadata?.social?.twitter || ``,
    },
    {
      name: `twitter:title`,
      content: metaTitle,
    },
    {
      name: `twitter:description`,
      content: metaDescription,
    },
  ]

  if (title === "") {
    meta = meta.concat([
      {
        property: `og:image`,
        content: `https://linksort.com/social-img-2x1-2.jpeg`,
      },
      {
        property: `og:image:width`,
        content: `1200`,
      },
      {
        property: `og:image:height`,
        content: `600`,
      },
      {
        name: `twitter:card`,
        content: `summary_large_image`,
      },
      {
        name: `twitter:image`,
        content: `https://linksort.com/social-img-2x1-2.jpeg`,
      },
    ])
  } else {
    meta = meta.concat([
      {
        name: `twitter:card`,
        content: `summary`,
      },
    ])
  }

  return (
    <Helmet
      htmlAttributes={{
        lang: "en",
      }}
      title={metaTitle}
      titleTemplate={!title ? null : `%s | ${defaultTitle}`}
      meta={meta}
    />
  )
}
