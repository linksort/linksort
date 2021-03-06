const description = `Linksort makes it effortless to save and organize your links to content around the web.`

module.exports = {
  flags: {
    DEV_SSR: false,
  },
  siteMetadata: {
    title: `Linksort`,
    author: {
      name: `Alexander Richey`,
      summary: `Founder of Linksort.`,
    },
    description: description,
    siteUrl: `https://linksort.com/`,
    social: {
      twitter: `AlexanderRichey`,
    },
  },
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/pages`,
        name: `pages`,
      },
    },
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [
          {
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 630,
              wrapperStyle: `border-radius: 1rem`,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-feed`,
      options: {
        query: `
          {
            site {
              siteMetadata {
                title
                description
                siteUrl
                site_url: siteUrl
              }
            }
          }
        `,
        feeds: [
          {
            serialize: ({ query: { site, allMarkdownRemark } }) => {
              return allMarkdownRemark.nodes.map(node => {
                return {
                  title: node.frontmatter.title,
                  date: node.frontmatter.date,
                  description: node.excerpt,
                  url: site.siteMetadata.siteUrl + "/blog" + node.fields.slug,
                }
              })
            },
            query: `
              {
                allMarkdownRemark(
                  filter: { fileAbsolutePath: { regex: "/content/blog/" } }
                  sort: { fields: [frontmatter___date], order: ASC }
                  limit: 1000
                ) {
                  nodes {
                    id
                    excerpt
                    fields {
                      slug
                    }
                    frontmatter {
                      title
                      date
                    }
                  }
                }
              }
            `,
            output: "/rss.xml",
            title: "Linksort",
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Linksort`,
        short_name: `Linksort`,
        description: description,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#ffffff`,
        display: `minimal-ui`,
        icon: `content/assets/favicon512.png`,
      },
    },
    `gatsby-plugin-react-helmet`,
    `@chakra-ui/gatsby-plugin`,
  ],
}
