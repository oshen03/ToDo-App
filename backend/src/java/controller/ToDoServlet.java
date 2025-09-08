package controller;

import hibernate.HibernateUtil;
import hibernate.ToDos;
import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.hibernate.Transaction;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.InputStreamReader;
import org.hibernate.Criteria;
import org.hibernate.Session;

/**
 *
 * @author Oshen Sathsara <oshensathsara2003@gmail.com>
 */
@WebServlet(name = "ToDoServlet", urlPatterns = {"/ToDoServlet"})
public class ToDoServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        
        setCorsHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        Session session = null;
        try {
            session = HibernateUtil.getSessionFactory().openSession();

            Criteria c = session.createCriteria(ToDos.class);
            List<ToDos> todos = c.list();

            Gson gson = new Gson();
            String json = gson.toJson(todos);
            response.getWriter().write(json);
            response.setStatus(HttpServletResponse.SC_OK);

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Failed to fetch todos\"}");
        } finally {
            if (session != null && session.isOpen()) {
                session.close();
            }
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        
        setCorsHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON from request body
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String jsonBody = sb.toString();

            // Parse JSON
            JsonObject jsonObject = JsonParser.parseString(jsonBody).getAsJsonObject();
            String title = jsonObject.get("title").getAsString();
            boolean completed = jsonObject.has("completed") && jsonObject.get("completed").getAsBoolean();

            if (title == null || title.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\": \"Title is required\"}");
                return;
            }

            Session session = null;
            Transaction transaction = null;

            try {
                session = HibernateUtil.getSessionFactory().openSession();
                transaction = session.beginTransaction();

                ToDos todo = new ToDos(title.trim(), completed);
                session.save(todo);

                transaction.commit();

                String json = new Gson().toJson(todo);
                response.getWriter().write(json);
                response.setStatus(HttpServletResponse.SC_CREATED);

            } catch (Exception e) {
                if (transaction != null) {
                    transaction.rollback();
                }
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"Failed to create todo\"}");
            } finally {
                if (session != null && session.isOpen()) {
                    session.close();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"Invalid JSON format\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

       
        setCorsHeaders(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // Read JSON from request body
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
            String jsonBody = sb.toString();

            // Parse JSON
            JsonObject jsonObject = JsonParser.parseString(jsonBody).getAsJsonObject();

            if (!jsonObject.has("id") || !jsonObject.has("title")) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"error\": \"ID and title are required\"}");
                return;
            }

            int id = jsonObject.get("id").getAsInt();
            String title = jsonObject.get("title").getAsString();
            boolean completed = jsonObject.has("completed") && jsonObject.get("completed").getAsBoolean();

            Session session = null;
            Transaction transaction = null;

            try {
                session = HibernateUtil.getSessionFactory().openSession();
                transaction = session.beginTransaction();

                ToDos todo = (ToDos) session.get(ToDos.class, id);

                if (todo != null) {
                    todo.setTitle(title.trim());
                    todo.setCompleted(completed);
                    session.update(todo);

                    transaction.commit();

                    String json = new Gson().toJson(todo);
                    response.getWriter().write(json);
                    response.setStatus(HttpServletResponse.SC_OK);
                } else {
                    transaction.rollback();
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    response.getWriter().write("{\"error\": \"Todo not found\"}");
                }

            } catch (Exception e) {
                if (transaction != null) {
                    transaction.rollback();
                }
                e.printStackTrace();
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"Failed to update todo\"}");
            } finally {
                if (session != null && session.isOpen()) {
                    session.close();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"Invalid JSON format\"}");
        }
    }

   @Override
protected void doDelete(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {

    setCorsHeaders(response);
    response.setContentType("application/json");
    response.setCharacterEncoding("UTF-8");

    // Try to get ID from URL parameter first
    String idParam = request.getParameter("id");
    
    if (idParam != null && !idParam.trim().isEmpty()) {
        // Use URL parameter approach
        System.out.println("Using URL parameter: " + idParam);
        
        try {
            int id = Integer.parseInt(idParam);
            deleteToDoById(id, response);
            return;
        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"Invalid ID format in URL parameter\"}");
            return;
        }
    }

    // Fallback to request body approach
    System.out.println("No URL parameter found, trying request body");
    
    try {
        // Read from request body 
        StringBuilder sb = new StringBuilder();
        String line;
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(request.getInputStream(), "UTF-8"))) {
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }
        
        String jsonBody = sb.toString();
        System.out.println("Request body: '" + jsonBody + "'");

        if (jsonBody == null || jsonBody.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"No ID provided in URL parameter or request body\"}");
            return;
        }

        JsonObject jsonObject = JsonParser.parseString(jsonBody.trim()).getAsJsonObject();
        
        if (!jsonObject.has("id")) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"error\": \"ID is required\"}");
            return;
        }

        int id = jsonObject.get("id").getAsInt();
        deleteToDoById(id, response);

    } catch (Exception e) {
        e.printStackTrace();
        response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        response.getWriter().write("{\"error\": \"Invalid request: " + e.getMessage() + "\"}");
    }
}

private void deleteToDoById(int id, HttpServletResponse response) throws IOException {
    Session session = null;
    Transaction transaction = null;

    try {
        session = HibernateUtil.getSessionFactory().openSession();
        transaction = session.beginTransaction();

        ToDos todo = (ToDos) session.get(ToDos.class, id);
        System.out.println("Found todo for deletion: " + (todo != null ? todo.getTitle() : "null"));

        if (todo != null) {
            session.delete(todo);
            transaction.commit();
            response.getWriter().write("{\"message\": \"Todo deleted successfully\"}");
            response.setStatus(HttpServletResponse.SC_OK);
        } else {
            if (transaction != null) {
                transaction.rollback();
            }
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            response.getWriter().write("{\"error\": \"Todo with ID " + id + " not found\"}");
        }

    } catch (Exception e) {
        if (transaction != null) {
            transaction.rollback();
        }
        e.printStackTrace();
        response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        response.getWriter().write("{\"error\": \"Database error: " + e.getMessage() + "\"}");
    } finally {
        if (session != null && session.isOpen()) {
            session.close();
        }
    }
}

    @Override
    protected void doOptions(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        setCorsHeaders(response);
        response.setStatus(HttpServletResponse.SC_OK);
    }

    private void setCorsHeaders(HttpServletResponse response) {
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        response.setHeader("Access-Control-Max-Age", "3600");
    }
}