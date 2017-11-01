const { Article } = require('../models');

module.exports = {
  // Only admin can create and update Article
  /**
  * @description - Creates a new article
  * @param {object} request - request object containing the article title, price,available_quantity,image,
  * description received from the client
  * @param {object} response - response object served to the client
  * @returns {json} article - new article created
  */
  create(req, res) {
    const newArticle = {
      title: req.body.title,
      content: req.body.content,
      excerpt: req.body.excerpt,
      imageURL: req.body.imageURL,
      userId: req.params.userId,
    };
    // Type is either revision or article.
    // a user can create a revision of an article
    if (req.body.type) {
      newArticle.type = req.body.type;
    }
    return Article
      .create(newArticle)
      .then(article => res.status(200).send(article))
      .catch((error) => {
        res.status(500).send({ message: error });
      });
  },
  /**
  * @description - Fetches all articles
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} articles - articles fetched
  */
  list(req, res) {
    return Article
      .findAll()
      .then(articles => res.status(200).send(articles))
      .catch(error => res.status(500).send({ message: error }));
  },

  /**
  * @description - Fetches an article
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} article - fetched article
  */
  getOne(req, res) {
    return Article
      .findById(req.params.articleId)
      .then((article) => {
        if (!article) {
          return res.status(404).send({
            message: 'Article Not Found',
          });
        }
        return res.status(200).send(article);
      })
      .catch((error) => {
        res.status(500).send({ message: error });
      });
  },

  /**
  * @description - Updates article details
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} article - updated article details
  */
  update(req, res) {
    return Article
      .findById(req.params.articleId)
      .then((article) => {
        if (!article) {
          return res.status(404).send({
            message: 'Article Not Found',
          });
        }
        return article
          .update({
            title: req.body.title || article.title,
            content: req.body.content || article.content,
            excerpt: req.body.excerpt || article.excerpt,
            imageURL: req.body.imageURL || article.imageURL,
            type: req.body.type || article.type,
          })
          .then(updatedArticle => res.status(200).send(updatedArticle));
      })
      .catch(error => res.status(500).send({ message: error }));
  },
  /**
  * @description - Deletes an article
  * @param {object} request - request object received from the client
  * @param {object} response - response object served to the client
  * @returns {json} message, response or error
  */
  destroy(req, res) {
    return Article
      .findById(req.params.articleId)
      .then((article) => {
        if (!article) {
          return res.status(500).send({
            message: 'Article Not Found',
          });
        }
        return article
          .destroy()
          .then(() => res.status(200).send({ message: 'Article deleted.' }));
      })
      .catch(error => res.status(500).send({ message: error }));
  },
  validate(req, res, next) {
    req.checkBody('title', 'Please enter the title of your article.').notEmpty().isLength({ max: 30 });
    req.checkBody('content', 'You must enter the content of the article and allows only alphabets').notEmpty().isAlpha();
    req.checkBody('excerpt', 'Enter a short summary of your article. It must not be less than 1000 characters.').optional().isLength({ max: 1000 });
    req.checkBody('imageURL', 'You must enter a valid url for your image.').optional().isURL();

    const validatorErrors = req.validationErrors();
    if (validatorErrors) {
      const response = [];
      validatorErrors.forEach((err) => {
        response.push(err.msg);
      });
      return res.status(422).json({ message: response });
    }
    return next();
  },
  validateBeforeUpdate(req, res, next) {
    req.checkBody('title', 'Please enter the title of your article.').optional().isLength({ max: 30 });
    req.checkBody('content', 'You must enter the content of the article and allows only alphabets').optional().isAlpha();
    req.checkBody('excerpt', 'Enter a short summary of your article. It must not be less than 1000 characters.').optional().isLength({ max: 1000 });
    req.checkBody('imageURL', 'You must enter a valid url for your image.').optional().isURL();

    const validatorErrors = req.validationErrors();
    if (validatorErrors) {
      const response = [];
      validatorErrors.forEach((err) => {
        response.push(err.msg);
      });
      return res.status(422).json({ message: response });
    }
    return next();
  },
  sanitizer(req, res, next) {
    req.checkBody('name').escape();
    return next();
  },
  desanitizer(req, res, next) {
    req.checkBody('name').unescape();
    return next();
  },
  hasAuthorization(req, res, next) {
    if (req.article.user.id !== req.user.id) {
      return res.status(403).send({ message: 'User is not authorized' });
    }
    return next();
  },
};

