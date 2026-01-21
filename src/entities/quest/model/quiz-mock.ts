export interface QuizItem {
  id: number;
  place: string;
  question: string;
  choices: string[];
  answer: string;
  description: string;
  hint: string;
}

export const QuizMock: QuizItem[] = [
  {
    id: 1,
    place: 'Gyeongbokgung Palace',
    question: '“Gyeongbokgung” was the main royal palace of which Korean dynasty?',
    choices: ['Silla', 'Goryeo', 'Joseon', 'Baekje'],
    answer: 'Joseon',
    description:
      'Gyeongbokgung was built in 1395 and served as the main palace of Joseon for over 500 years.',
    hint: 'It was the first and grandest palace of the Joseon era.',
  },
  {
    id: 2,
    place: 'Gyeongbokgung Palace',
    question: 'Which gate is the main southern entrance of Gyeongbokgung?',
    choices: ['Heungnyemun', 'Geunjeongmun', 'Gwanghwamun', 'Sinmumun'],
    answer: 'Gwanghwamun',
    description: 'Gwanghwamun faces south toward Gwanghwamun Square and is the biggest gate.',
    hint: 'It faces Gwanghwamun Square.',
  },
  {
    id: 3,
    question: 'What year was Gyeongbokgung originally built?',
    place: 'Gyeongbokgung Palace',
    choices: ['1395', '1420', '1500', '1320'],
    answer: '1395',
    description: 'It was constructed in 1395, three years after Joseon was founded.',
    hint: 'It was built right after the Joseon Dynasty was founded.',
  },
  {
    id: 4,
    question: 'What is the name of the main throne hall in Gyeongbokgung?',
    place: 'Gyeongbokgung Palace',
    choices: ['Geunjeongjeon', 'Jagyeongjeon', 'Sujeongjeon', 'Gyeonghoeru'],
    answer: 'Geunjeongjeon',
    description: 'Geunjeongjeon was used for major state affairs including royal coronations.',
    hint: 'Royal ceremonies were held here.',
  },
  {
    id: 5,
    place: 'Gyeongbokgung Palace',
    question: 'What is the famous pavilion on the pond inside Gyeongbokgung?',
    choices: ['Gyeonghoeru', 'Hyangwonjeong', 'Chundangji', 'Okru'],
    answer: 'Gyeonghoeru',
    description: 'Gyeonghoeru Pavilion was used for special banquets and royal celebrations.',
    hint: 'Banquets and celebrations were held here.',
  },
];
