import { Link, useNavigate, useParams } from "react-router-dom";
import lightLogo from "../imgs/logo-light.png";
import darkLogo from "../imgs/logo-dark.png";

import lightBanner from "../imgs/blog banner light.png";
import darkBanner from "../imgs/blog banner dark.png";
import AnimationWrapper from "../common/page-animation";
import { uploadOnCloudinary } from "../common/cludinary.jsx";
import { useContext, useEffect, useRef, useState } from "react";

import { toast, Toaster } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages.jsx";

import EditorJs from "@editorjs/editorjs";
import { tools } from "./tools.component.jsx";
import axios from "axios";
import { ThemeContext, UserContext } from "../App.jsx";

const BlogEditor = () => {
  //? USING the states, we don't need'a reference Hook
  //! let blogBannerRef = useRef();

  let navigate = useNavigate();

  let { blog_id } = useParams();
  //*Editor COntext from editor-page
  let {
    blog,
    blog: { title, banner, content, tags, des },
    // blog: { title = "", banner = "", content = [], tags = [], des = "" } = {}, // Destructure with defaults
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  let {
    userAuth: { access_token },
  } = useContext(UserContext);

  let { theme } = useContext(ThemeContext);
  //*This will show the changes in the vlog State
  // console.log(blog);

  //*USEEFFECT
  // useEffect(() => {
  //   setTextEditor(
  //     new EditorJs({
  //       holderId: "textEditor",
  //       data: "",
  //       tools: tools,
  //       placeholder: "Let's Write an Blog!",
  //     })
  //   );
  // }, []);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setTextEditor(
        new EditorJs({
          holderId: "textEditor",
          data: Array.isArray(content) ? content[0] : content,
          tools: tools,
          placeholder: "Let's Write a Blog!",
        })
      );
    }, 2000); // 2 seconds delay

    // Cleanup function to clear timeout if the component unmounts
    return () => clearTimeout(timeout);
  }, []);

  //* HandleBannerUpload
  const handleBannerUpload = async (e) => {
    let img = e.target.files[0];

    if (img) {
      try {
        //*Cloudinary.jsx se jo response data aayga wo yaha responseImgURL m
        const responseImageURL = await uploadOnCloudinary(img);

        let loadingToast = toast.loading("Uploading...");
        if (responseImageURL) {
          toast.dismiss(loadingToast);
          toast.success("Uploades ✌️");
          //?Using blog state doesn't need anymore of refrence
          //! blogBannerRef.current.src = responseImageURL;

          //*SETBLOG via states
          setBlog({ ...blog, banner: responseImageURL });
        }
      } catch (error) {
        return toast.error(error);
      }
    }
  };

  //* HandleTitleKeyDown
  const handleTitleKeyDown = (e) => {
    if (e.keyCode == 13) {
      e.preventDefault();
    }
  };

  //*HandleTitleChange
  const handleTitleChange = (e) => {
    let input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";

    setBlog({ ...blog, title: input.value });
  };

  //*handleError
  const handleError = (e) => {
    let img = e.target;
    img.src = theme == "light" ? lightBanner : darkBanner;
  };

  //*PublishFormEvent
  const handlePublishEvent = () => {
    //*First Validate, then publish
    if (!banner.length) {
      return toast.error("Upload a banner to publish it!");
    }

    if (!title.length) {
      return toast.error("Write blog title to publish it!");
    }

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            setBlog({ ...blog, content: data });
            setEditorState("publish");
          } else {
            return toast.error("Write Something in your Blog to publish it!");
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
  };

  //*handleSaveDraft
  const handleSaveDraft = async (e) => {
    if (e.target.className.includes("disable")) {
      return;
    }
    if (!title.length) {
      return toast.error("write blog title before saving it as a draft");
    }

    let loadingToast = toast.loading("Saving draft...");

    e.target.classList.add("disable");

    if (textEditor.isReady) {
      textEditor.save().then(async (content) => {
        let blogObj = {
          title,
          banner,
          des,
          content,
          tags,
          draft: true,
        };

        await axios
          .post(
            import.meta.env.VITE_SERVER_DOMAIN + "/create-blog",
            { ...blogObj, id: blog_id },
            {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            }
          )
          .then(() => {
            e.target.classList.remove("disable");

            toast.dismiss(loadingToast);
            toast.success("Saved 🐦‍🔥");

            setTimeout(() => {
              navigate("/dashboard/blogs?tab=draft");
            }, 500);
          })
          .catch(({ response }) => {
            e.target.classList.remove("disable");

            toast.dismiss(loadingToast);

            return toast.error(response.data.error);
          });
      });
    }
  };

  //*RETURN--------------------
  return (
    <>
      <nav className="navbar">
        <Link to="/" className="flex-none w-10">
          <img src={theme == "light" ? darkLogo : lightLogo} alt="logo.png" />
        </Link>
        <p className="max-md:hidden text-black line-clamp-1 w-full">
          {title.length ? title : "New Blog"}
        </p>
        <div className="flex gap-4 ml-auto">
          <button className="btn-dark py-2" onClick={handlePublishEvent}>
            Publish
          </button>
          <button className="btn-light py-2" onClick={handleSaveDraft}>
            Save Draft
          </button>
        </div>
      </nav>
      <Toaster />
      <AnimationWrapper>
        <section>
          <div className="mx-auto max-w-[900px] w-full">
            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
              <label htmlFor="uploadBanner">
                <img
                  //? USING the states, we don't need'a reference Hook
                  //! ref={blogBannerRef}
                  //* src={defaultBanner}
                  src={banner}
                  alt="DefaultBanner"
                  className="z-20"
                  onError={handleError}
                />
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            <textarea
              defaultValue={title}
              placeholder="Blog Title"
              className="text-4xl font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40 bg-white"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5" />

            <div id="textEditor" className="font-gelasio"></div>
          </div>
        </section>
      </AnimationWrapper>
    </>
  );
};

export default BlogEditor;
