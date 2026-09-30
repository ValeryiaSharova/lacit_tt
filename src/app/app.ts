import { Component } from '@angular/core';
import { TaskBoardComponent } from './components/task-board/task-board';

@Component({
  selector: 'app-root',
  imports: [TaskBoardComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
