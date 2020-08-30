const express = require('express')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const { v4: uuid } = require('uuid');
const logger = require('../logger')
const bookmarks = require('../store')

bookmarksRouter
.route('/bookmarks')
.get((req, res) => {
    res
    .json(bookmarks)
})

.post(bodyParser, (req, res) => {
    const { title, url, description, rating } = req.body;
    
    if  (!title) {
        logger.error(`title is required`);
        return res
        .status(400)
        .send('Invalid data');
    }
    
    if (!url) {
        logger.error(`url is required`);
        return res
        .status(400)
        .send('Invalid data');
    }
    
    const id = uuid();
    
    const bookmark = {
        id,
        title,
        url, 
        description,
        rating
    };
    
    bookmarks.push(bookmark);
    
    logger.info(`Bookmark with id ${id} created`);
    res
    .status(201)
    .location(`http://localhost:8000/bookmark/${id}`)
    .json(bookmark);
})

bookmarksRouter
.route('/bookmark/:id')
.get((req, res) => {
    const { id } = req.params;
    const bookmark = bookmarks.find(c => c.id == id);
    
    if (!bookmark) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
        .status(404)
        .send('Not Found');
    }
    
    res.json(bookmark);
})
.delete((req, res) => {
    const { id } = req.params;
    
    const bookmarkIndex = bookmarks.findIndex(b => b.id == id);
    
    if (bookmarkIndex === -1) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
        .status(404)
        .send('Not Found');
    }
    
    bookmarks.splice(bookmarkIndex, 1);
    
    logger.info(`Bookmark with id ${id} deleted.`);
    res
    .send(`Bookmark with id ${id} deleted.`)
    .end();
})

module.exports = bookmarksRouter