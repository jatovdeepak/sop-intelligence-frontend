import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function SsoLogin() {

  const navigate = useNavigate();

  useEffect(() => {

    const run = async () => {

      try {

        /*
          Read token from URL
        */

        const params =
          new URLSearchParams(
            window.location.search
          );

        const token =
          params.get("token");

        console.log(
          "SSO TOKEN:",
          token
        );

        /*
          Missing token
        */

        if (!token) {

          console.error(
            "Missing SSO token"
          );

          navigate(
            "/login",
            { replace: true }
          );

          return;
        }

        /*
          Exchange SSO token
          for SOP auth token
        */

        const response = await fetch(
          "http://localhost:3000/api/auth/sso-login",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ssoToken: token,
            }),
          }
        );

        console.log(
          "STATUS:",
          response.status
        );

        const data =
          await response.json();

        console.log(
          "DATA:",
          data
        );

        /*
          Success
        */

        if (
          response.ok &&
          data.token
        ) {

          /*
            Save session
          */

          sessionStorage.setItem(
            "token",
            data.token
          );

          sessionStorage.setItem(
            "role",
            data.role
          );

          /*
            Human-readable role
          */

          sessionStorage.setItem(
            "roleLabel",
            data.roleLabel || data.role
          );

          sessionStorage.setItem(
            "system",
            data.system
          );

          sessionStorage.setItem(
            "userid",
            data.userid
          );

          console.log(
            "SSO LOGIN SUCCESS"
          );

          /*
            Redirect dashboard
          */

          navigate(
            "/",
            { replace: true }
          );

          return;
        }

        /*
          Failed auth
        */

        console.error(
          "SSO LOGIN FAILED"
        );

        navigate(
          "/login",
          { replace: true }
        );

      } catch (err) {

        console.error(
          "SSO ERROR:",
          err
        );

        navigate(
          "/login",
          { replace: true }
        );
      }
    };

    run();

  }, [navigate]);

  return (
    <div
      style={{
        padding: "20px",
        fontSize: "18px",
      }}
    >
      Logging into SOP Intelligence...
    </div>
  );
}