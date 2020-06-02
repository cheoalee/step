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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
import com.google.appengine.api.blobstore.BlobInfo;
import com.google.appengine.api.blobstore.BlobInfoFactory;
import com.google.appengine.api.blobstore.BlobKey;
import com.google.appengine.api.blobstore.BlobstoreService;
import com.google.appengine.api.blobstore.BlobstoreServiceFactory;
import com.google.appengine.api.images.ImagesService;
import com.google.appengine.api.images.ImagesServiceFactory;
import com.google.appengine.api.images.ServingUrlOptions;
import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.AnnotateImageResponse;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.EntityAnnotation;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.protobuf.ByteString;

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
    String imageLoc;
    List<String> labelDetails;
    long timestamp;

   /**
    * @param entityId Id of the entity, used for Datastore storage.
    * @param userComment The content of the comment left by a visitor.
    * @param submissionTime The time at which the comment was submitted.
    */
    private Comment(long entityId, String userName, String userComment, String imageURL, List<String> imageLabelDetails, long submissionTime) {
        id = entityId;
        name = userName;
        comment = userComment;
        imageLoc = imageURL;
        labelDetails = imageLabelDetails;
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
    // Get the visitor choice of # of comments to view.
    visitorChoice = getVisitorChoice(request);

    String name = secureReformat(getParameter(request, "visitor-name", ""));
    String comment = secureReformat(getParameter(request, "visitor-comment", ""));
    String imageURL = getUploadedFileUrl(request, "image");
    long timestamp = System.currentTimeMillis();
    boolean upperCase = Boolean.parseBoolean(getParameter(request, "upper-case", "false"));

    // Convert the comment to upper case if specified.
    if (upperCase) {
      comment = comment.toUpperCase();
    }

    /* Get Image Labels */
    // Get the BlobKey that points to the image uploaded by the user.
    BlobKey blobKey = getBlobKey(request, "image");

    // Get the labels of the image that the user uploaded.
    byte[] blobBytes = getBlobBytes(blobKey);
    List<EntityAnnotation> imageLabels = getImageLabels(blobBytes);

    List<String> imageLabelDetails = new ArrayList<String>();
    for (EntityAnnotation label : imageLabels) {
      imageLabelDetails.add(label.getDescription() + ": " + label.getScore());
    }

    // Store comment as entity in Datastore.
    Entity taskEntity = new Entity("Task");
    taskEntity.setProperty("name", name);
    taskEntity.setProperty("comment", comment);
    taskEntity.setProperty("imageLoc", imageURL);
    taskEntity.setProperty("labelDetails", imageLabelDetails);
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
        String imageLoc = (String) entity.getProperty("imageLoc");
        List<String> imageLabelDetails = (List<String>) entity.getProperty("labelDetails");
        long timestamp = (long) entity.getProperty("timestamp");

        Comment comment = new Comment(id, userName, userComment, imageLoc, imageLabelDetails, timestamp);
        comments.add(comment);
        commentCount++;
      }
    }

    response.setContentType("application/json;");
    response.getWriter().println(convertToJsonUsingGson(comments));
  }

 /**
  * Reformat comments to prevent HTML and script injections.
  * @param input Comment to reformat.
  * @return Comment with HTML tags replaced.
  */
  private String secureReformat(String input) {
    return input.replace("<", "&lt;").replace(">", "&gt;");
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

  /**
   * Get the URL of the image that the user uploaded to Blobstore.
   * @param request
   * @param formInputElementName What the file element's name is in blobstore-upload.html.
   * @return A URL that points to the uploaded file, or null if the user didn't upload a file.
   */
  private String getUploadedFileUrl(HttpServletRequest request, String formInputElementName) {
    BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file, so we can't get a URL. (dev server)
    if (blobKeys == null || blobKeys.isEmpty()) {
      return null;
    }

    // Our form only contains a single file input, so get the first index.
    BlobKey blobKey = blobKeys.get(0);

    // User submitted form without selecting a file, so we can't get a URL. (live server)
    BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
    if (blobInfo.getSize() == 0) {
      blobstoreService.delete(blobKey);
      return null;
    }

    // Use ImagesService to get a URL that points to the uploaded file.
    ImagesService imagesService = ImagesServiceFactory.getImagesService();
    ServingUrlOptions options = ServingUrlOptions.Builder.withBlobKey(blobKey);

    // To support running in Google Cloud Shell with AppEngine's devserver, we must use the relative
    // path to the image, rather than the path returned by imagesService which contains a host.
    try {
      URL url = new URL(imagesService.getServingUrl(options));
      return url.getPath();
    } catch (MalformedURLException e) {
      return imagesService.getServingUrl(options);
    }
  }

   /**
   * Returns the BlobKey that points to the file uploaded by the user, or null if the user didn't
   * upload a file.
   * @param request
   * @param formInputElementName What the file element's name is in blobstore-upload.html.
   * @return The Blobkey for the uploaded file.
   */
  private BlobKey getBlobKey(HttpServletRequest request, String formInputElementName) {
    BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();
    Map<String, List<BlobKey>> blobs = blobstoreService.getUploads(request);
    List<BlobKey> blobKeys = blobs.get("image");

    // User submitted form without selecting a file, so we can't get a BlobKey. (dev server)
    if (blobKeys == null || blobKeys.isEmpty()) {
      return null;
    }

    // Our form only contains a single file input, so get the first index.
    BlobKey blobKey = blobKeys.get(0);

    // User submitted form without selecting a file, so the BlobKey is empty. (live server)
    BlobInfo blobInfo = new BlobInfoFactory().loadBlobInfo(blobKey);
    if (blobInfo.getSize() == 0) {
      blobstoreService.delete(blobKey);
      return null;
    }

    return blobKey;
  }

  /**
   * Blobstore stores files as binary data. This function retrieves the binary data stored at the
   * BlobKey parameter.
   * @param blobKey
   * @return Bytes of the blob with the given blobKey.
   */
  private byte[] getBlobBytes(BlobKey blobKey) throws IOException {
    BlobstoreService blobstoreService = BlobstoreServiceFactory.getBlobstoreService();
    ByteArrayOutputStream outputBytes = new ByteArrayOutputStream();

    int fetchSize = BlobstoreService.MAX_BLOB_FETCH_SIZE;
    long currentByteIndex = 0;
    boolean continueReading = true;
    while (continueReading) {
      // End index is inclusive, so we have to subtract 1 to get fetchSize bytes.
      byte[] b =
          blobstoreService.fetchData(blobKey, currentByteIndex, currentByteIndex + fetchSize - 1);
      outputBytes.write(b);

      // If we read fewer bytes than we requested, then we reached the end.
      if (b.length < fetchSize) {
        continueReading = false;
      }

      currentByteIndex += fetchSize;
    }

    return outputBytes.toByteArray();
  }

  /**
   * Uses the Google Cloud Vision API to generate a list of labels that apply to the image
   * represented by the binary data stored in imgBytes.
   * @param imgBytes 
   * @return list of labels generated for the image with the given bytes.
   */
  private List<EntityAnnotation> getImageLabels(byte[] imgBytes) throws IOException {
    ByteString byteString = ByteString.copyFrom(imgBytes);
    Image image = Image.newBuilder().setContent(byteString).build();

    Feature feature = Feature.newBuilder().setType(Feature.Type.LABEL_DETECTION).build();
    AnnotateImageRequest request =
        AnnotateImageRequest.newBuilder().addFeatures(feature).setImage(image).build();
    List<AnnotateImageRequest> requests = new ArrayList<>();
    requests.add(request);

    ImageAnnotatorClient client = ImageAnnotatorClient.create();
    BatchAnnotateImagesResponse batchResponse = client.batchAnnotateImages(requests);
    client.close();
    List<AnnotateImageResponse> imageResponses = batchResponse.getResponsesList();
    AnnotateImageResponse imageResponse = imageResponses.get(0);

    if (imageResponse.hasError()) {
      System.err.println("Error getting image labels: " + imageResponse.getError().getMessage());
      return null;
    }

    return imageResponse.getLabelAnnotationsList();
  }
}
