---
title: Technical goals
date: 2021-03-02
description: As I start to build out Linksort's properties, I have some constraints and goals in mind. In this post, I'm going to enumerate some of these goals and explain why I think they make sense. The goals that follow do not make up an exhaustive list. There are many standard goals—such as being secure, having good metrics and error reporting, and so on—that any web-based software has and which I'll discuss in later posts. The goals enumerated here are a bit more subtle and are inspired by what I learned from my last project.
author: Alex Richey
---
<aside class="message">
  This is a technical post that is probably only of interest to developers.
</aside>

Linksort is going to have at least the following three properties:

- **Splash page:** A page where people can learn about what Linksort is.
- **Blog:** A place where I and other team members can post articles like this one, support materials, progress reports, announcements, and other things.
- **Application:** The actual web app.

As I start to build out these properties, I have some constraints and goals in mind. In this post, I'm going to enumerate some of these goals and explain why I think they make sense.

The goals that follow do not make up an exhaustive list. There are many standard goals—such as being secure, having good metrics and error reporting, and so on—that any web-based software has and which I'll discuss in later posts. The goals enumerated here are a bit more subtle and are inspired by what I learned from my last project.

## 1. I would like all of Linksort's properties to share the same styles.

Design inconsistencies are not desirable and it's almost always good, from a developer perspective, to reuse code rather than to reimplement the same or similar things in multiple projects. The reason I bring up this goal here is that it is surprisingly difficult to achieve from a technical perspective. I don't have a plan to achieve this goal yet, but it's something I'm keeping in mind from the start.

Another reason why I think this goal is important is that I think that having some design constraints—like those imposed by a styling system that is reused and adhered to—can result in not just more consistent designs than otherwise, but even better designs. There's something about limiting one's creative space that can actually give rise to more creativity—at least that's how my experience has been.

## 2. I would like the splash page and the application to be housed in the same URL. 

Let me explain what I mean. For the last project I worked on, I decided to house the application at `app.hiconvo.com` and the splash page at `hiconvo.com`. This is a common pattern that I've seen a [number](https://clubhouse.io/) [of](https://sendgrid.com/) [companies](https://www.netlify.com/) use. It worked well in my case and made development of the splash page and the web app easy since each one had its own git repository and CI/CD pipeline. The problem was that, if a user were to go to `hiconvo.com`, she had to click a link to `app.hiconvo.com` to actually use the app. This pattern is fine for B2B-type apps, but for a consumer app like Linksort, I think the extra click is a non-starter. It would be better if the server were smart enough to serve the app if the user is already logged in and the splash page if she isn't.

Moreover, this is how many major customer-facing apps work. [Twitter](https://twitter.com), [Facebook](https://facebook.com), [Instagram](https://instagram.com), and [others](https://github.com) all serve their apps directly if the user is logged in and I suspect the reason why all of them have converged on this behavior is that they have evidence that shows that it is the best approach.

## 3. I would like the application to load quickly.

This is a goal that any web application has, but I mean something fairly specific here. The last project I worked on used a pattern for handling authentication that's common today among many applications, particularly those using the so-called [JAMstack](https://jamstack.org/) . The pattern is that, when a user logs in, her token is sent back from the server and saved to the browser's `localStorage` (which is protected by a strict Content Security Policy and the usual XSS mitigations—more on this in a later post). When the user returns, after the application loads, it checks to see if a token exists in `localStorage` and, if so, sends a request to the server to get the user's information.

This approach works well from a development perspective in part because it allows for a clean separation of concerns between frontend and backend, where both can be managed and deployed independently. The problem is that the page-load experience can be slow since the browser needs to make several round trips to retrieve the data that it needs.

I used to think that this wasn't much of an issue because, at the end of the day, loading is still pretty fast and, if this pattern results in more rapid development, then having an app that's a little slower now is better than having a faster one in a month or so. However, last summer I experimented with writing a little app with some more old-school patterns and was surprised at the difference that lack of round-trips makes. After I got used to the page loading instantly with all of my data, it was hard to go back to waiting that second or so. I realized that, during that second of waiting, my mind wonders a bit and sometimes I even lose focus on what I was originally trying to do. I came to believe that, at least for my part, it is worthwhile to eliminate those round-trips if possible.
