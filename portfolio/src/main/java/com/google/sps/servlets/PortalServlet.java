// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.sps.servlets;

import com.google.appengine.api.datastore.*;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import java.io.IOException;
import java.io.PrintWriter;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/portal")
public class PortalServlet extends HttpServlet {

 /**
  * Determine if user has logged in and what to show them, accordingly.
  * @param request
  * @param response
  */
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    response.setContentType("text/html");
    PrintWriter out = response.getWriter();
    UserService userService = UserServiceFactory.getUserService();

    // If user is not logged in, show a login form (could also redirect to a login page)
    if (!userService.isUserLoggedIn()) {
      String loginUrl = userService.createLoginURL("/portal");
      out.println("<p>Hello, stranger.</p>");
      out.println("<p>Login <a href=\"" + loginUrl + "\">here</a>.</p>");
      return;
    }

    // If user has not set a nickname, redirect to nickname page
    String nickname = getUserNickname(userService.getCurrentUser().getUserId());
    if (nickname == null) {
      response.sendRedirect("/login");
      return;
    }

    // User is logged in and has a nickname, so the request can proceed
    String logoutUrl = userService.createLogoutURL("/portal");
    out.println("<h1>Portal</h1>");
    out.println("<p>Hello " + nickname + "!</p>");
    out.println("<p>Logout <a href=\"" + logoutUrl + "\">here</a>.</p>");
    out.println("<p>Change your nickname <a href=\"/login\">here</a>.</p>");
  }

 /**
  * @param id
  * @return Nickname of the user with id, or empty String if the user has not set a nickname.
  */
  private String getUserNickname(String id) {
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Query query =
        new Query("UserInfo")
            .setFilter(new Query.FilterPredicate("id", Query.FilterOperator.EQUAL, id));
    PreparedQuery results = datastore.prepare(query);
    Entity entity = results.asSingleEntity();
    if (entity == null) {
      return null;
    }
    String nickname = (String) entity.getProperty("nickname");
    return nickname;
  }
}
