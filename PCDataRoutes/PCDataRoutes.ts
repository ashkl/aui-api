import express = require("express");
import { fetchPCData } from "./utils";

const router = express.Router();

router.get("/mainpc", async (req, res) => {
  const mainPC = process.env.MAIN_PC;
  if (!mainPC) {
    return res
      .status(500)
      .send({ error: "MAIN_PC environment variable is not set." });
  }
  const data = await fetchPCData(mainPC);
  res.send(data);
});

router.get("/gamingpc", async (req, res) => {
  const gamingPC = process.env.GAMING_PC;
  if (!gamingPC) {
    return res
      .status(500)
      .send({ error: "GAMING_PC environment variable is not set." });
  }
  const data = await fetchPCData(gamingPC);
  res.send(data);
});

module.exports = router;
