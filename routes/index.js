
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'The J&K Messages' });
};