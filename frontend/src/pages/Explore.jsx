import { useState } from "react";
import Sidebar from "../components/Sidebar";
import Content from "../components/Contents";
import Explore_content from "../components/Explore_content";
import twitter from "../assets/images/twitter.png";
import PostModal from "../components/PostModal";

const Explore = () => {
  const [isBlurred, setIsBlurred] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
    <div className="relative w-screen h-screen overflow-x-hidden">

      {isBlurred && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-lg z-20"></div>
      )}

      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between bg-white px-4 py-3 shadow-md">
        <div className="text-xl font-bold flex items-center space-x-2">
          <img src={twitter} alt="Logo" className="w-8 h-8" />
          <span>Twiller</span>
        </div>
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-md"
        >
          ☰
        </button>
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div className="bg-white w-68 h-screen max-h-screen shadow-lg overflow-y-auto overflow-x-hidden pt-2 px-3 pb-2">

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-black font-bold mb-4"
            >
              ✕ Close
            </button>
            <Sidebar setBlur={setIsBlurred} />
          </div>
          <div
            className="flex-1 bg-black/40"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        </div>
      )}

      <div
        className={`flex flex-col lg:flex-row lg:px-45 overflow-y-auto transition-all duration-300 ${
          isBlurred ? "blur-md pointer-events-none" : ""
        }`}
      >
        <div className="hidden lg:block w-63 sticky top-0 h-screen">
          <Sidebar setBlur={setIsBlurred} />
        </div>

        <div className="flex-1 h-screen pl-1 mt-[80px] lg:mt-0"> 
          <Explore_content setBlur={setIsBlurred} />
        </div>

        <div className="hidden lg:block w-[1px] bg-gray-300 h-full"></div>
        <div className="hidden lg:block w-78 sticky top-0 h-screen">
          <Content setBlur={setIsBlurred} />
        </div>
      </div>

      <PostModal isOpen={isBlurred} onClose={() => setIsBlurred(false)} />
    </div>
  );
};

export default Explore;
