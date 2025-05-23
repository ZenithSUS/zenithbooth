import { toast } from "react-toastify";
import { useNavigate, Navigate } from "react-router-dom";
import { account } from "../appwrite";
import { useState, useEffect } from "react";
import { ErrorType } from "../utils/types";
import Loading from "../components/ui/loading";
import CameraIcon from "../assets/ui/camera.png";
import fetchAuthUser from "../lib/services/getAuth";

export default function Login() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    const checkAuth = async () => {
      let userSession = JSON.parse(localStorage.getItem("session") || "false");
      if (userSession) {
        const authResult = await fetchAuthUser(userSession);
        setIsAuthenticated(!!authResult);
      } else {
        try {
          const session = await account.getSession("current");
          if (session && session.current) {
            userSession = session.current;
            localStorage.setItem("session", JSON.stringify(userSession));
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error("Session error:", error);
          setIsAuthenticated(false);
        }
      }
      setIsAuthChecking(false);
    };

    checkAuth();
  }, []);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!email || !password) {
        toast.error("Please fill in all fields");
        return;
      }

      const session = await account.createEmailPasswordSession(email, password);

      localStorage.setItem("session", JSON.stringify(session));

      const data = await account.get();

      localStorage.setItem("id", JSON.stringify(data.$id));
      localStorage.setItem("name", JSON.stringify(data.name));
      localStorage.setItem("email", JSON.stringify(data.email));
      localStorage.setItem("joined", JSON.stringify(data.$createdAt));
      localStorage.setItem(
        "profileImage",
        JSON.stringify(data.prefs?.imageUrl || ""),
      );
      localStorage.setItem(
        "profileId",
        JSON.stringify(data.prefs?.imageId || ""),
      );

      toast.success("Logged in Successfully!");

      window.location.href = "/dashboard";
    } catch (error: unknown) {
      const err = error as ErrorType;
      if (err.code === 400) toast.error("Invalid Credentials!");
      if (err.code === 404) toast.error("User not found!");
      if (err.code === 401) toast.error("Invalid Credentials!");
      console.error("Login error:", error);
    }
  };

  if (isAuthChecking) {
    return <Loading />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <main className="flex h-screen w-screen flex-col items-center justify-center">
      <form className="bg-primary-light relative flex w-[300px] flex-col justify-center gap-5 rounded-md p-4 ring-2 ring-black md:w-[400px]">
        <img
          src={CameraIcon}
          alt="camera"
          className="absolute top-0 h-10 w-10 cursor-pointer self-end p-0.5 transition duration-300 ease-in-out hover:scale-110"
          onClick={() => navigate("/")}
        />
        <h1 className="text-center text-3xl font-bold">Login</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-xl font-bold">
            Email
          </label>
          <input
            className="rounded-md bg-white p-2 ring-2 ring-black/55"
            name="email"
            id="email"
            type="text"
            autoComplete="on"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-xl font-bold">
            Password
          </label>
          <input
            className="rounded-md bg-white p-2 ring-2 ring-black/55"
            name="password"
            id="password"
            type="password"
            autoComplete="on"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
          />
        </div>
        <button
          className="bg-secondary-dark hover:bg-secondary-darker/80 cursor-pointer rounded p-2 text-lg font-semibold text-white transition duration-300 ease-in-out hover:scale-95"
          onClick={login}
          type="submit"
        >
          Login
        </button>
        <p className="text-center">
          Don't have an account?{" "}
          <span
            className="cursor-pointer underline hover:text-blue-500"
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </p>
      </form>
    </main>
  );
}
