import { TestBed } from '@angular/core/testing';
import { ChatBotService } from './chatBotService';

describe('Chatbot', () => {
  let service: ChatBotService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatBotService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
