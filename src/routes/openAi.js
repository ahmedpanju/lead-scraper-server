const express = require("express");
const { Configuration, OpenAIApi } = require("openai");
const R = require("ramda");
const router = express.Router();

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_API_KEY,
});

const openai = new OpenAIApi(configuration);

router.post("/new-prompt-multi", async (req, res) => {
  try {
    let generatedResponses = [];

    await Promise.all(
      req.body.users.map(async (user) => {
        const generatedResponse = await openai.createCompletion({
          model: "text-davinci-003",
          prompt: user.prompt,
          max_tokens: 200,
        });

        generatedResponses.push({
          ...user,
          generatedResponse: generatedResponse.data.choices[0].text,
        });
      })
    );

    res.status(200).json(generatedResponses);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

router.post("/new-prompt", async (req, res) => {
  try {
    const generatedResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: req.body.prompt,
      max_tokens: 200,
      temperature: 0,
    });

    res.status(200).json(generatedResponse.data.choices[0].text);
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

module.exports = router;
