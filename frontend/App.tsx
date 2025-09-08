import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

const NGROK_URL = 'https://037abf333eb4.ngrok-free.app/backend//ToDoServlet';

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(NGROK_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      console.error('Error fetching todos:', error);
      Alert.alert('Error', 'Failed to fetch todos');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (!newTodo.trim()) return;

    const todoData = {
      title: newTodo,
      completed: false
    };

    try {
      const response = await fetch(NGROK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });

      if (response.ok) {
        setNewTodo('');
        fetchTodos();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding todo:', error);
      Alert.alert('Error', 'Failed to add todo');
    }
  };

  const toggleTodo = async (todo: Todo) => {
    const todoData = {
      id: todo.id,
      title: todo.title,
      completed: !todo.completed
    };

    try {
      const response = await fetch(NGROK_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(todoData),
      });

      if (response.ok) {
        fetchTodos();
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating todo:', error);
      Alert.alert('Error', 'Failed to update todo');
    }
  };

  const deleteTodo = async (id: number) => {
    // console.log('Deleting todo with ID:', id);
    
    try {
      const response = await fetch(`${NGROK_URL}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // console.log('Delete response status:', response.status);
      
      if (response.ok) {
        console.log('Todo deleted successfully');
        fetchTodos();
      } else {
        const errorText = await response.text();
        console.log('Delete error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
      Alert.alert('Error', 'Failed to delete todo');
    }
  };

  const renderTodo = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <TouchableOpacity 
        onPress={() => toggleTodo(item)} 
        style={styles.todoContent}
        activeOpacity={0.7}
      >
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, item.completed && styles.checkboxCompleted]}>
            {item.completed && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>
        <View style={styles.todoTextContainer}>
          <Text style={[styles.todoText, item.completed && styles.completedText]}>
            {item.title}
          </Text>
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, item.completed && styles.statusCompleted]}>
              {item.completed ? '✓ Completed' : '○ Pending'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        onPress={() => deleteTodo(item.id)} 
        style={styles.deleteButton}
        activeOpacity={0.8}
      >
        <Text style={styles.deleteText}>🗑</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading your todos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.title}>To Do🗒️</Text>
        <Text>
          <Text style={styles.subtitlePending}>
            {todos.filter(todo => !todo.completed).length} pending
          </Text>
          <Text style={styles.subtitle}> , </Text>
          <Text style={styles.subtitleComplete}>
            {todos.filter(todo => todo.completed).length} completed
          </Text>
        </Text>
      </View>
      
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={newTodo}
            onChangeText={setNewTodo}
            placeholder="What needs to be done?"
            placeholderTextColor="#7e65a1ff"
            onSubmitEditing={addTodo}
          />
        </View>
        <TouchableOpacity 
          style={[styles.addButton, !newTodo.trim() && styles.addButtonDisabled]} 
          onPress={addTodo}
          disabled={!newTodo.trim()}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={todos}
        renderItem={renderTodo}
        keyExtractor={(item) => item.id.toString()}
        style={styles.todoList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>Add your first task above to get started!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({

  subtitlePending: {
    fontSize: 14,
    color: '#650bf5ff',
    fontWeight: '500',
  },
  subtitleComplete: {
    fontSize: 14,
    color: '#10b967ff',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: 60,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    color: '#ada8b6ff',
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#ccd4ffff',
    shadowColor: '#121128ff',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6f5684ff',
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  input: {
    backgroundColor: '#e9e0ffff',
    borderWidth: 1,
    borderColor: '#e8e8e8ff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#6366F1',
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0.1,
  },
  addButtonText: {
    color: '#9287f7ff',
    fontSize: 24,
    fontWeight: '600',
  },
  todoList: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  todoContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  todoTextContainer: {
    flex: 1,
  },
  todoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 20,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  statusContainer: {
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
  },
  statusCompleted: {
    color: '#10B981',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  deleteText: {
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8673a5ff',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#954fdbff',
    textAlign: 'center',
    lineHeight: 20,
  },
});