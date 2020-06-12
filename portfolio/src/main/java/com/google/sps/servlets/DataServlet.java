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

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;

/** Servlet that handles comments, feeding into and reading from Datastore.*/
@WebServlet("/data")
public class DataServlet extends HttpServlet {
  // Number of comments the visitor chooses to see.
  int visitorChoice;

/** A comment from a page visitor. */
  private class Comment {
    long id;
    String name;
    String comment;
    long timestamp;

   /**
    * @param entityId Id of the entity, used for Datastore storage.
    * @param userComment The content of the comment left by a visitor.
    * @param submissionTime The time at which the comment was submitted.
    */
    private Comment(long entityId, String userName, String userComment, long submissionTime) {
        id = entityId;
        name = userName;
        comment = userComment;
        timestamp = submissionTime;
    }
  }   

  /**
  * Post to page according to user input.
  * @param request
  * @param response
  */
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    // Get the input from the form.
    visitorChoice = getVisitorChoice(request);
    String name = getParameter(request, "visitor-name", "");
    String comment = getParameter(request, "visitor-comment", "");
    long timestamp = System.currentTimeMillis();
    boolean upperCase = Boolean.parseBoolean(getParameter(request, "upper-case", "false"));

    // Convert the comment to upper case.
    if (upperCase) {
      comment = comment.toUpperCase();
    }

    // Store comment as entity in Datastore.
    Entity taskEntity = new Entity("Task");
    taskEntity.setProperty("name", name);
    taskEntity.setProperty("comment", comment);
    taskEntity.setProperty("timestamp", timestamp);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    datastore.put(taskEntity);

    // Bring user to comments section
    response.sendRedirect("/data");
  }

 /**
  * Load comments from Datastore.
  * @param request
  * @param response
  */
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Query query = new Query("Task").addSort("timestamp", SortDirection.DESCENDING);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery results = datastore.prepare(query);

    List<Comment> comments = new ArrayList<>();
    int commentCount = 0;
    iterateEntities:
    for (Entity entity : results.asIterable()) {
      if (commentCount >= visitorChoice) {
          break iterateEntities;
      } else {
        long id = entity.getKey().getId();
        String userName = (String) entity.getProperty("name");
        String userComment = (String) entity.getProperty("comment");
        long timestamp = (long) entity.getProperty("timestamp");

        Comment comment = new Comment(id, userName, userComment, timestamp);
        comments.add(comment);
        commentCount++;
      }
    }

    response.setContentType("application/json;");
    response.getWriter().println(convertToJsonUsingGson(comments));
  }

  /**
   * Returns the choice, for number of comments to display, entered by the visitor,
   * or -1 if the choice was invalid.
   * @param request
   * @return Number of comments to display as an int, or -1 if invalid value
   * entered (0-10 only).
   */
  private int getVisitorChoice(HttpServletRequest request) {
    // Get the input from the form.
    String visitorChoiceString = request.getParameter("visitor-choice");

    // Convert the input to an int.
    int visitorChoice;
    try {
      visitorChoice = Integer.parseInt(visitorChoiceString);
    } catch (NumberFormatException e) {
      System.err.println("Could not convert to int: " + visitorChoiceString);
      return -1;
    }

    // Check that the input is between 0 and 10.
    if (visitorChoice < 0 || visitorChoice > 10) {
      System.err.println("Choice is out of range: " + visitorChoiceString);
      return -1;
    }

    return visitorChoice;
  }

  /**
   * @param request
   * @param name
   * @param defaultValue
   * @return The request parameter, or the default value if the parameter
   *         was not specified by the client.
   */
  private String getParameter(HttpServletRequest request, String name, String defaultValue) {
    String value = request.getParameter(name);
    if (value == null) {
      return defaultValue;
    }
    return value;
  }

  /**
   * Converts an ArrayList of Comments into a JSON string using the Gson library. Note: First added
   * the Gson library dependency to pom.xml.
   * @param comments Comments from the server.
   * @return Message as a JSON.
   */
  private String convertToJsonUsingGson(List<Comment> comments) {
    Gson gson = new GsonBuilder().setPrettyPrinting().create();
    return gson.toJson(comments);
  }
}
