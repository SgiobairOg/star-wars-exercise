import { Component, OnInit } from "@angular/core";
import { PeopleService } from "../services/people.service";
import { Organism } from "../shared/models/organism.interface";
import { TitleCasePipe } from "@angular/common";
import { UnitsPipe } from "../shared/pipes/units.pipe";
import { GenderPipe } from "../shared/pipes/gender.pipe";
import { GalacticYearPipe } from "../shared/pipes/galactic-year.pipe";
import { Subject } from "rxjs/Subject";
import "rxjs/add/operator/debounceTime";

@Component({
	selector: "app-list",
	templateUrl: "list.component.html",
	styleUrls: ["list.component.scss"],
	providers: [PeopleService]
})
export class ListComponent implements OnInit {
	people: Organism[] = [];
	querySubject = new Subject<string>();
	loaded: boolean = false;

	constructor(private peopleService: PeopleService) {}

	ngOnInit() {
		this.peopleService.getAllPeople().subscribe(
			people => {
				console.log("Data received from Subject...");
				console.table(people);
				this.people = people;
				/**
				 * 	The BehaviorSubject receives an initial value of [] on first run
				 * 	once we actually receive values we'll set the loaded flag.
				 */
				if (people.length > 0) {
					this.loaded = true;
				}
			},
			error => console.error(error)
		);

		this.querySubject
			.debounceTime(500)
			.subscribe(queryString => this.searchPeople(queryString));
	}

	searchPeople(queryString: string) {
		console.info(`Search query received: '${queryString}'`);
		this.peopleService.searchPeople(queryString).subscribe(
			people => {
				console.log("Searched data received from Subject...");
				console.table(people);
				this.people = people;
			},
			error => console.error(error)
		);
	}
}