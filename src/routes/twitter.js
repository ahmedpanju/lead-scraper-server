const { TwitterApi } = require("twitter-api-v2");
const R = require("ramda");
const express = require("express");
const router = express.Router();

const userClient = new TwitterApi({
  appKey: process.env.TWITTER_APP_KEY,
  appSecret: process.env.TWITTER_APP_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

router.post("/new-query", async (req, res) => {
  let finalUserList = [];
  try {
    const foundUsers = await userClient.v1.searchUsers(req.body.query, {
      page: req.body.pageNumber || 1,
      count: 20,
    });

    foundUsers._realData.map((user) => {
      finalUserList.push({
        screenname: R.pathOr(null, ["screen_name"], user),
        bio: R.pathOr(null, ["description"], user),
        followers: R.pathOr(0, ["followers_count"], user),
        location: R.pathOr(null, ["location"], user),
        name: R.pathOr(null, ["name"], user),
        url: R.pathOr(null, ["url"], user),
        verified: R.pathOr(false, ["verified"], user),
      });
    });

    res.status(200).json({
      users: finalUserList,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

module.exports = router;
