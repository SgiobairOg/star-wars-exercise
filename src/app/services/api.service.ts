import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { environment } from 'environments/environment';
import 'rxjs/add/observable/empty';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/expand';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/reduce';
import { Observable } from 'rxjs/Observable';
import { Organism } from '../shared/models/organism.interface';

// Load the API_URL from the environment variable
const API_URL = environment.apiUrl;

/**
 * Star Wars API Interface
 * defines and object with a string property for the next url page
 * and an Organism property for the returned results
 */
interface SwapiRes {
	next: string;
	results: Organism;
}

/**
 * API SERVICE
 * 
 * Methods for communicating with the Star Wars API
 * and for distributing the data.
 */

@Injectable()
export class ApiService {

	// Provide the http module to the service
	constructor(private http: Http) {}

	/** 
	 * Returns an observable of all Organisms in the API
	 * @returns Observable
	 */
	public getAllPeople(): Observable<Organism[]> {
		console.info('Making an API call for data...');

		// Request the first page from the API
		return this.getApiPage(API_URL)
			.expand( 
				// Expand the reults of the first call to recursively load each page of results
				(r: SwapiRes) =>
					this.isNil(r.next)
						? Observable.empty()
						: this.getApiPage(r.next)
			)
			.map((response) => response.results;)
			//.do((data) => console.log('Apis.GetAll People: ', data))
			/*.reduce(
				// Reduce the API responses into a single array of Organisms
				(a: ReadonlyArray<Organism>, v: SwapiRes) =>
					a.concat(v.results),
				[]
			)*;
	}

	/** 
	 * Returns the JSON from a URL
	 * @param {string} url
	 * @returns: {object} JSON response
	 * */	
	private getApiPage(url) {
		return this.http.get(url).map((r) => r.json());
	}

	/** 
	 * Returns a boolean indicating whether the property passed is empty
	 * @param {string} 
	 * @returns {boolean}
	 * */
	private isNil<A>(a: A): boolean {
		return a === null || a === undefined;
	}
}
