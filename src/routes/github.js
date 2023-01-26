const express = require("express");
const R = require("ramda");
const router = express.Router();
const { Octokit, App } = require("octokit");

const octokit = new Octokit({
  auth: process.env.GITHUB_ACCESS_KEY,
});

router.post("/new-query", async (req, res) => {
  try {
    let finalUserList = [];
    let finalUserListCsv = [
      [
        "Name",
        "Username",
        "Email",
        "Bio",
        "Hireable",
        "Twitter",
        "Location",
        "Github",
        "Company",
        "Blog",
      ],
    ];
    const users = await octokit.request(
      "GET /search/users{?q,sort,order,per_page,page}",
      {
        q: req.body.query,
        per_page: 100,
        page: req.body.pageNumber,
      }
    );

    await Promise.all(
      users.data.items.map(async (user, index) => {
        const singleUserData = await octokit.request("GET /user/{id}", {
          id: user.id,
        });

        finalUserList.push({
          name: R.pathOr(null, ["data", "name"], singleUserData),
          username: R.pathOr(null, ["data", "login"], singleUserData),
          email: R.pathOr(null, ["data", "email"], singleUserData),
          bio: R.pathOr(null, ["data", "bio"], singleUserData),
          hireable: R.path(["data", "hireable"], singleUserData) ? "Yes" : "No",
          twitter: R.path(["data", "twitter_username"], singleUserData)
            ? `https://www.twitter.com/${R.path(
                ["data", "twitter_username"],
                singleUserData
              )}`
            : null,
          githubProfile: R.pathOr(null, ["data", "html_url"], singleUserData),
          location: R.pathOr(null, ["data", "location"], singleUserData),
          company: R.pathOr(null, ["data", "company"], singleUserData),
          blog: !!R.path(["data", "blog"], singleUserData)
            ? R.path(["data", "blog"], singleUserData)
            : null,
        });
        finalUserListCsv.push([
          R.pathOr("N/A", ["data", "name"], singleUserData),
          R.pathOr("N/A", ["data", "login"], singleUserData),
          R.pathOr("N/A", ["data", "email"], singleUserData),
          R.pathOr("N/A", ["data", "bio"], singleUserData),
          R.path(["data", "hireable"], singleUserData) ? "Yes" : "No",
          R.path(["data", "twitter_username"], singleUserData)
            ? `https://www.twitter.com/${R.path(
                ["data", "twitter_username"],
                singleUserData
              )}`
            : "N/A",
          R.pathOr("N/A", ["data", "location"], singleUserData),
          R.pathOr("N/A", ["data", "html_url"], singleUserData),
          R.pathOr("N/A", ["data", "company"], singleUserData),
          !!R.path(["data", "blog"], singleUserData)
            ? R.path(["data", "blog"], singleUserData)
            : "N/A",
        ]);
      })
    );

    res.status(200).json({
      users: finalUserList,
      csvUsers: finalUserListCsv,
      totalCount: users.data.total_count,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

module.exports = router;
