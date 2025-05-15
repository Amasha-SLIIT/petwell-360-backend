const express = require('express');
const router = express.Router();
const Article = require('../models/articleModel');

// Get all articles
router.get('/', async (req, res) => {
  try {
    const articles = await Article.find().sort({ date: -1 });
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
});

// Get article by ID
router.get('/:id', async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
});

// Create new article
router.post('/', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const newArticle = new Article({
      title,
      content,
      author,
      date: new Date()
    });
    
    const savedArticle = await newArticle.save();
    res.status(201).json(savedArticle);
  } catch (error) {
    res.status(400).json({ message: 'Error creating article', error: error.message });
  }
});

// Update article
router.put('/:id', async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const updatedArticle = await Article.findByIdAndUpdate(
      req.params.id,
      { title, content, author },
      { new: true, runValidators: true }
    );
    
    if (!updatedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json(updatedArticle);
  } catch (error) {
    res.status(400).json({ message: 'Error updating article', error: error.message });
  }
});

// Delete article
router.delete('/:id', async (req, res) => {
  try {
    const deletedArticle = await Article.findByIdAndDelete(req.params.id);
    
    if (!deletedArticle) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting article', error: error.message });
  }
});

module.exports = router;
