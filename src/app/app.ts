import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from './app/shared/header/header';
import { Footer } from './app/shared/footer/footer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Header, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected title = 'FitTrack';
}
