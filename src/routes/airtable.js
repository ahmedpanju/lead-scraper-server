const express = require("express");
const router = express.Router();
const Airtable = require("airtable");

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_ACCESS_KEY,
});

router.post("/add-record", async (req, res) => {
  try {
    const base = Airtable.base(process.env.AIRTABLE_DEV_LEADS);

    base("The Big AI Night Leads").create(
      [
        {
          fields: {
            Name: req.body.name,
            Bio: req.body.bio,
            Username: req.body.username,
            Email: req.body.email,
            Location: req.body.location,
            Company: req.body.company,
          },
        },
      ],
      function (error, records) {
        if (error) {
          return;
        }
      }
    );
    res.status(200).json();
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

router.get("/fetch-all", async (req, res) => {
  let finalRecords = [];
  try {
    const base = Airtable.base(process.env.AIRTABLE_DEV_LEADS);
    base("The Big AI Night Leads")
      .select({
        maxRecords: 100,
        view: "Grid view",
      })
      .eachPage(
        function page(records, fetchNextPage) {
          records.forEach(function (record) {
            const username = record.get("Username");
            finalRecords.push(username);
          });

          fetchNextPage();
        },
        function done(error) {
          if (error) {
            return;
          }
          res.status(200).json(finalRecords);
        }
      );
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error,
    });
  }
});

module.exports = router;
