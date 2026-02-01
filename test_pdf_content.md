# Test PDF Content Generator

This script creates sample PDF files for testing the PDF upload functionality.

## Sample Content for Compiler Design Module

### Lexical Analysis

Lexical analysis is the first phase of a compiler. The lexical analyzer reads the stream of characters making up the source program and groups the characters into meaningful sequences called lexemes. For each lexeme, the lexical analyzer produces as output a token of the form (token-name, attribute-value) that it passes on to the subsequent phase, syntax analysis.

The lexical analyzer interacts with the symbol table as well. When the lexical analyzer discovers a lexeme constituting an identifier, it needs to enter that lexeme into the symbol table. Tokens are the building blocks of syntax.

### Pattern Matching

A regular expression is a notation for describing sets of character strings. If a string is in the language denoted by a regular expression, we say that the string matches the regular expression. Regular expressions are used to specify lexeme patterns for tokens.

### Finite Automata

Finite automata are recognizers that simply say yes or no for each possible input string. A finite automaton consists of states and transitions between states based on input symbols. Deterministic finite automata (DFA) have exactly one transition for each state-symbol pair.

### Token Recognition

The process of token recognition involves scanning the input characters and grouping them into tokens based on predefined patterns. Tokens represent syntactic categories like identifiers, keywords, operators, and literals. The lexical analyzer uses pattern matching to identify these tokens.

### Symbol Table Management

The symbol table is a data structure used throughout all phases of the compiler. It stores information about identifiers, including their names, types, scope, and memory location. Efficient symbol table management is crucial for compiler performance.

---

To test this:
1. Save this as a PDF file
2. Upload through Admin Dashboard "Generate from PDF" feature
3. Verify module and questions are created
4. Check student side to see the new module
