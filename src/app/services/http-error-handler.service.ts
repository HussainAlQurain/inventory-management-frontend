import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorHandlerService {
  // Maximum number of retries
  maxRetries = 3;
  
  // Base delay for exponential backoff (in ms)
  baseDelay = 1000;
  
  constructor() { }

  /**
   * Handle HTTP errors with optional retry mechanism
   * @param error The error response
   * @param errorMessage Custom error message to log
   * @param retryAttempt Current retry attempt (internal use)
   * @returns An observable that throws the error
   */
  handleError(error: HttpErrorResponse, errorMessage: string, retryAttempt = 0): Observable<never> {
    // For database connection errors, try to retry with exponential backoff
    if (this.isConnectionError(error) && retryAttempt < this.maxRetries) {
      console.log(`Connection issue. Retrying (${retryAttempt + 1}/${this.maxRetries})...`);
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      const delay = this.baseDelay * Math.pow(2, retryAttempt);
      
      return timer(delay).pipe(
        mergeMap(() => throwError(() => ({ 
          error, 
          message: errorMessage, 
          retryAttempt: retryAttempt + 1,
          needsRetry: true
        })))
      );
    }
    
    // Log the error
    if (error.status === 0) {
      console.error('A network error occurred:', error);
    } else {
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
    }
    
    // Return a user-facing error message
    return throwError(() => ({
      error,
      message: errorMessage,
      needsRetry: false
    }));
  }
  
  /**
   * Check if the error is related to database connection issues
   */
  private isConnectionError(error: HttpErrorResponse): boolean {
    // Check for connection timeouts
    if (error.status === 0) {
      return true;
    }
    
    // Database connection pool issues typically return 500 status
    if (error.status === 500) {
      const errorMsg = error.error?.message || JSON.stringify(error.error);
      if (errorMsg?.includes('Connection is not available') || 
          errorMsg?.includes('HikariPool') || 
          errorMsg?.includes('connection pool')) {
        return true;
      }
    }
    
    return false;
  }
}