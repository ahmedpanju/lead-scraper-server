const express = require("express");
const R = require("ramda");
const router = express.Router();
const { Octokit, App } = require("octokit");
const axios = require("axios");

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
          followers: R.pathOr(null, ["data", "followers"], singleUserData),
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

router.post("/lead-quality", async (req, res) => {
  try {
    const reposForThatUser = await octokit.request(
      "GET /users/{username}/repos{?type,sort,direction,per_page,page}",
      {
        username: req.body.username,
      }
    );

    const thingsToMatchRepoWith = [
      "machine learning",
      "learning",
      "neural network",
      "neural",
      "artifical",
      "artifical intellegence",
      "intellegence",
      "learn",
    ];

    const checkIfNameMatches = (name = "") =>
      name.toLowerCase().includes("machine learning") ||
      name.toLowerCase().includes("learning") ||
      name.toLowerCase().includes("neural network") ||
      name.toLowerCase().includes("neural") ||
      name.toLowerCase().includes("artifical") ||
      name.toLowerCase().includes("artifical intellegence") ||
      name.toLowerCase().includes("intellegence") ||
      name.toLowerCase().includes("learn");

    const checkIfDescriptionMatches = (description = "") => {
      if (description) {
        return (
          description.toLowerCase().includes("machine learning") ||
          description.toLowerCase().includes("learning") ||
          description.toLowerCase().includes("neural network") ||
          description.toLowerCase().includes("neural") ||
          description.toLowerCase().includes("artifical") ||
          description.toLowerCase().includes("artifical intellegence") ||
          description.toLowerCase().includes("intellegence") ||
          description.toLowerCase().includes("learn")
        );
      }
      return false;
    };

    const numberOfReposThatMatchTheCriteria = reposForThatUser.data.filter(
      (repo) =>
        checkIfNameMatches(repo.name) ||
        checkIfDescriptionMatches(repo.description)
    ).length;

    let arrayOfLanguagesForAllRepos = [];

    await Promise.all(
      reposForThatUser.data.map(async (singleRepo) => {
        const languageResponse = await octokit.request(
          `GET ${singleRepo.languages_url}`
        );
        arrayOfLanguagesForAllRepos.push(languageResponse.data);
      })
    );

    const objectWithTotalLanguages = arrayOfLanguagesForAllRepos.reduce(
      (acc, repo) => {
        for (let lang in repo) {
          acc[lang] = (acc[lang] || 0) + repo[lang];
        }
        return acc;
      },
      {}
    );

    const qualityOfLead = await axios.post(
      "https://rve3o0b6ni.execute-api.ap-southeast-1.amazonaws.com/dev/models/github",
      {
        repoCount: numberOfReposThatMatchTheCriteria,
        followerCount: req.body.followers,
        languages: objectWithTotalLanguages,
      }
    );

    res.status(200).json({
      quality: qualityOfLead.data,
      repoCount: numberOfReposThatMatchTheCriteria,
      followerCount: req.body.followers,
      languages: objectWithTotalLanguages,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

module.exports = router;
