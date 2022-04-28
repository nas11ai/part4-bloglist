const dummy = () => 1;

const totalLikes = (blogs) => {
  const likesReducer = (sum, obj) => sum + obj.likes;
  return blogs.reduce(likesReducer, 0);
};

const favoriteBlog = (blogs) => blogs.reduce((prev, cur) => {
  if (prev.likes > cur.likes) {
    return prev;
  }
  return cur;
}, 0);

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
};
