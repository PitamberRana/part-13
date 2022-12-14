const router = require("express").Router();
const { tokenExtractor } = require("../util/middleware");
const { Op } = require("sequelize");

const { Note, User } = require("../models");

const noteFinder = async (req, res, next) => {
  req.note = await Note.findByPk(req.params.id);
  next();
};

router.get("/", async (req, res) => {
  let important = {
    [Op.in]: [true, false],
  };
  if (req.query.important) {
    important = req.query.important === "true";
  }

  const notes = await Note.findAll({
    attributes: { exclude: ["userId"] },
    include: {
      model: User,
      attributes: ["name"],
    },
    where: {
      important,
      content: {
        [Op.substring]: req.query.search ? req.query.search : "",
      },
    },
  });
  res.json(notes);
});

router.post("/", tokenExtractor, async (req, res) => {
  try {
    const note = await Note.create({
      ...req.body,
      userId: req.decodedToken.id,
    });
    res.json(note);
  } catch (error) {
    return res.status(400).json({ error });
  }
});

router.get("/:id", noteFinder, async (req, res) => {
  if (req.note) {
    res.json(req.note);
  } else {
    res.status(404).end();
  }
});

router.delete("/:id", noteFinder, async (req, res) => {
  if (req.note) {
    await req.note.destroy();
  }
  res.status(204).end();
});

router.put("/:id", noteFinder, async (req, res) => {
  if (req.note) {
    req.note.important = req.body.important;
    await req.note.save();
    res.json(req.note);
  } else {
    res.status(404).end();
  }
});

module.exports = router;
