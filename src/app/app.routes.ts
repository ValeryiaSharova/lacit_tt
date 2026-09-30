import { Routes } from '@angular/router';
import { TaskBoardComponent } from './components/task-board/task-board';
import { TaskDetailsComponent } from './components/task-details/task-details';

export const routes: Routes = [
  { path: '', component: TaskBoardComponent },
  { path: 'tasks/:uuid', component: TaskDetailsComponent },
];
