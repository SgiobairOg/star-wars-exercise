import { TitleCasePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/skipWhile';
import 'rxjs/add/operator/withLatestFrom';
import 'rxjs/add/operator/zip';
import 'rxjs/add/operator/concatAll';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { from } from 'rxjs/observable/from';
import { Subject } from 'rxjs/Subject';
import { PeopleService } from '../services/people.service';
import {
	FilterAttribute,
	FilterAttributeOption
} from '../shared/models/filter.interface';
import { Organism } from '../shared/models/organism.interface';
import { GalacticYearPipe } from '../shared/pipes/galactic-year.pipe';
import { GenderPipe } from '../shared/pipes/gender.pipe';
import { UnitsPipe } from '../shared/pipes/units.pipe';
import { Observable } from 'rxjs/Observable';

@Component({
	selector: 'app-list',
	templateUrl: 'list.component.html',
	styleUrls: ['list.component.scss'],
	providers: [PeopleService]
})
export class ListComponent implements OnInit {
	private people: Observable<Organism[]>;
	private loaded: boolean = true;

	private querySubject = new Subject<string>();
	private filterSubject = new BehaviorSubject<FilterAttribute[]>([]);
	private heightOptionsSubject = new BehaviorSubject<FilterAttributeOption[]>([]);
	private massOptionsSubject = new BehaviorSubject<FilterAttributeOption[]>([]);
	private hairColorOptionsSubject = new BehaviorSubject<FilterAttributeOption[]>([]);
	private skinColorOptionsSubject = new BehaviorSubject<FilterAttributeOption[]>([]);
	private eyeColorOptionsSubject = new BehaviorSubject<FilterAttributeOption[]>([]);
	private genderOptionsSubject = new BehaviorSubject<FilterAttributeOption[]>([]);

	constructor(private peopleService: PeopleService) {}

	public ngOnInit() {
		/**
		 * Subscribe to the peopleService to receive people
		 */
		this.people = this.peopleService.getAllPeople()
			//.concatAll()
			.reduce( (store, chunk) => {
				return store.concat(chunk);
			}, []);

		this.peopleService
			.getFilterOptions()
			['height'].subscribe(this.heightOptionsSubject);
		this.peopleService
			.getFilterOptions()
			['mass'].subscribe(this.massOptionsSubject);
		this.peopleService
			.getFilterOptions()
			['hair_color'].subscribe(this.hairColorOptionsSubject);
		this.peopleService
			.getFilterOptions()
			['skin_color'].subscribe(this.skinColorOptionsSubject);
		this.peopleService
			.getFilterOptions()
			['eye_color'].subscribe(this.eyeColorOptionsSubject);
		this.peopleService
			.getFilterOptions()
			['gender'].subscribe(this.genderOptionsSubject);

		// Subscribe to the querySubject to the searchPeople observable
		this.querySubject
			.debounceTime(500)
			.subscribe((queryString) => this.searchPeople(queryString));
	}

	/**
	 * Communicates with the peopleService to return a list filtered search results
	 * @param queryString 
	 */
	public searchPeople(queryString: string) {
		console.info(`Search query received: '${queryString}'`);
		this.peopleService.searchPeople(queryString).subscribe(
			(people) => {
				this.people = this.filterPeople(people);
			},
			(error) => console.error(error)
		);
	}

	/*
	.subscribe(
			(people) => {
				console.log('Data received from Subject...');
				console.table(people);
				this.people = this.people.concat(people);
				/**
				 * 	The BehaviorSubject receives an initial value of [] on first run
				 * 	once we actually receive values we'll set the loaded flag.
				 */
			/*	
			},
			(error) => console.error(error)
		)
	*/

	/**
	 * Returns a subject with its values filtered
	 * @param subject 
	 */
	private sortOptions(subject) {
		return subject.getValue().sort((a, b) => {
			return a.value.localeCompare(b.value, undefined, {
				numeric: true,
				sensitivity: 'base'
			});
		});
	}

	/**
	 * Return a filterSource Observable from a given filterSubject
	 * @param filterSubject 
	 */
	private filterSource(filterSubject: BehaviorSubject<FilterAttributeOption[]>) {
		return filterSubject
			.map((options) => {
				return options.filter((option) => {
					return option.isActiveFilter.getValue();
				});
			})
			.map((options) => options.map((option) => option.value));
	}

	/**
	 * Returns a list of people filtered based on the values in the 6 observable filterSources
	 * @param people 
	 */
	private filterPeople(people: Organism[]): Organism[] {
		console.log('Filtering...');
		let filteredPeople = [];
		const peopleSource = from(people);
		const heightSource = this.filterSource(this.heightOptionsSubject);
		const massSource = this.filterSource(this.massOptionsSubject);
		const hairColorSource = this.filterSource(this.hairColorOptionsSubject);
		const eyeColorSource = this.filterSource(this.eyeColorOptionsSubject);
		const skinColorSource = this.filterSource(this.skinColorOptionsSubject);
		const genderSource = this.filterSource(this.genderOptionsSubject);

		const filterSource = heightSource.zip(
			massSource,
			hairColorSource,
			eyeColorSource,
			skinColorSource,
			genderSource,
			(f1, f2, f3, f4, f5, f6) => {
				return {
					height: f1,
					mass: f2,
					hair_color: f3,
					eye_color: f4,
					skin_color: f5,
					gender: f6
				};
			}
		);

		peopleSource
			.withLatestFrom(filterSource, (p, options) => {
				return { person: p, optionsArray: options };
			})
			.filter((check) => {
				return this.filterCheck(check, 'height');
			})
			.filter((check) => {
				return this.filterCheck(check, 'mass');
			})
			.filter((check) => {
				return this.filterCheck(check, 'hair_color');
			})
			.filter((check) => {
				return this.filterCheck(check, 'eye_color');
			})
			.filter((check) => {
				return this.filterCheck(check, 'skin_color');
			})
			.filter((check) => {
				return this.filterCheck(check, 'gender');
			})
			.map((checked) => checked.person)
			.reduce(
				(acc: ReadonlyArray<Organism>, person) => acc.concat(person),
				[]
			)
			.subscribe(
				(people) => (filteredPeople = people),
				(error) => console.error(error)
			);
		return filteredPeople;
	}

	/**
	 * Returns true if there are no filters selected or if the persons attribute matches a selected attribute value
	 * @param check An object consisting of a person and options
	 * @param attribute Attribute to check against
	 */
	private filterCheck(check, attribute) {
		if (
			check.optionsArray[attribute].length === 0 ||
			check.optionsArray[attribute].includes(check.person[attribute])
		) {
			return true;
		}
	}
}
