import { useContext } from "react";
import { BlogContext } from "../pages/blog.page";
import CommentField from "./comment-field.component";
import axios from "axios";
import NoStateMessage from "./nodata.component";
import AnimationWrapper from "../common/page-animation";
import CommentCard from "./comment-card.component";

export const fetchComments = async ({
  skip = 0,
  blog_id,
  setParentCommentCountFun,
  comment_array = null,
}) => {
  try {
    const { data } = await axios.post(
      import.meta.env.VITE_SERVER_DOMAIN + "/get-blog-comments",
      { blog_id, skip }
    );

    // Add childrenLevel to each comment
    data.forEach((comment) => {
      comment.childrenLevel = 0;
    });

    // Update parent comment count
    setParentCommentCountFun((prev) => prev + data.length);

    // Return updated results
    if (comment_array == null) {
      return { results: data };
    } else {
      return { results: [...comment_array, ...data] };
    }
  } catch (err) {
    console.error("Error fetching comments:", err.message);
    return { results: comment_array || [] }; // Return current state if an error occurs
  }
};

// *CommetnsContainer
const CommentsContainer = () => {
  let {
    blog,
    blog: {
      _id,
      title,
      comments: { results: commentsArr },
      activity: { total_parent_comments },
    },
    setBlog,
    commentsWrapper,
    setCommentsWrapper,
    totalParentCommentsLoaded,
    setTotalParentCommentsLoaded,
  } = useContext(BlogContext);

  // *loadMoreComments
  const loadMoreComments = async () => {
    let newCommentArr = await fetchComments({
      skip: totalParentCommentsLoaded,
      blog_id: _id,
      setParentCommentCountFun: setTotalParentCommentsLoaded,
      comment_array: commentsArr,
    });

    setBlog({ ...blog, comments: newCommentArr });
  };

  return (
    // <div style={{ overflowY: "auto", height: "100%" }}>

    <div
      className={
        "max-sm:w-full fixed " +
        (commentsWrapper ? "top-0 sm:right-0" : "top-[100%] sm:right-[-100%]") +
        " duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto"
      }
    >
      <div className="relative">
        <h1 className="text-xl font-medium">Comments</h1>
        <p className="text-xl mt-2 w-[70%] text-dark-grey line-clamp-1">
          {title}
        </p>

        <button
          onClick={() => setCommentsWrapper((prev) => !prev)}
          className="absolute top-0 right-0 flex justify-center items-center w-12 h-12 rounded-full bg-grey "
        >
          <i className="fi fi-br-cross text-2xl"></i>
        </button>
      </div>

      <hr className="border-grey my-8 w-[120%] -ml-10" />

      <CommentField action="comment" />

      {commentsArr && commentsArr.length ? (
        commentsArr.map((comment, i) => {
          return (
            <AnimationWrapper key={i}>
              <CommentCard
                index={i}
                leftVal={comment.childrenLevel * 4}
                commentData={comment}
              />
            </AnimationWrapper>
          );
        })
      ) : (
        <NoStateMessage message="No Comments" />
      )}

      {total_parent_comments > totalParentCommentsLoaded ? (
        <button
          onClick={loadMoreComments}
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
        >
          Load More
        </button>
      ) : (
        " "
      )}
    </div>
  );
};

export default CommentsContainer;
