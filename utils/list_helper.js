const dummy = () => 1;

const totalLikes = (blogs) => {
  const likesReducer = (sum, obj) => sum + obj.likes;
  return blogs.reduce(likesReducer, 0);
};

module.exports = {
  dummy,
  totalLikes,
};
