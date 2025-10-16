import { NavigateFunction } from 'react-router-dom';

export interface User {
  id: string;
  email: string;
  role: string;
  student_name?: string;
}

export class NavigationService {
  /**
   * Determines the appropriate landing page for a user based on their role
   */
  static getDefaultRouteForRole(role: string): string {
    switch (role) {
      case 'teacher':
        return '/quiz-bank'; // Teachers go to quiz management
      case 'student':
        return '/online-exam'; // Students go to take exams
      default:
        return '/'; // Fallback to home
    }
  }

  /**
   * Handles post-login navigation
   * If user was trying to access a specific route, keep them there
   * Otherwise, redirect to their role-appropriate default page
   */
  static handlePostLoginNavigation(
    user: User, 
    navigate: NavigateFunction, 
    currentPath: string,
    allowedRoles: string[] = ['teacher', 'student']
  ): void {
    // Check if user's role is allowed for current route
    const isCurrentRouteAllowed = allowedRoles.includes(user.role);
    
    // If current route is allowed and it's not home page, stay here
    if (isCurrentRouteAllowed && currentPath !== '/') {
      console.log(`User ${user.role} staying on current route: ${currentPath}`);
      return; // Stay on current page
    }

    // If current route is not allowed or we're on home page, redirect to appropriate page
    const defaultRoute = this.getDefaultRouteForRole(user.role);
    console.log(`Redirecting ${user.role} to default route: ${defaultRoute}`);
    navigate(defaultRoute);
  }

  /**
   * Handles admin access for special users
   */
  static handleAdminAccess(user: User, navigate: NavigateFunction): boolean {
    if (user.email === 'lvdoqt@gmail.com') {
      // Admin can access admin page
      return true;
    }
    
    // Non-admin accessing admin route should be redirected
    navigate('/');
    return false;
  }

  /**
   * Gets user-friendly role names
   */
  static getRoleDisplayName(role: string): string {
    const roleNames: Record<string, string> = {
      'teacher': 'Giáo viên',
      'student': 'Học sinh',
      'admin': 'Quản trị viên'
    };
    
    return roleNames[role] || role;
  }

  /**
   * Determines if a route requires specific roles
   */
  static getRoutePermissions(path: string): string[] {
    const routePermissions: Record<string, string[]> = {
      '/': ['teacher', 'student'], // Home accessible to all
      '/quiz-bank': ['teacher'], // Only teachers
      '/create': ['teacher'], // Only teachers
      '/online-exam': ['teacher', 'student'], // All authenticated users
      '/exam': ['teacher', 'student'], // All authenticated users
      '/admin': ['admin'] // Special admin access
    };

    return routePermissions[path] || ['teacher', 'student'];
  }

  /**
   * Checks if user has permission for a specific route
   */
  static hasRoutePermission(user: User, path: string): boolean {
    // Special case for admin route
    if (path === '/admin') {
      return user.email === 'lvdoqt@gmail.com';
    }

    const allowedRoles = this.getRoutePermissions(path);
    return allowedRoles.includes(user.role);
  }
}