"use client"
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { Card, CardContent, Typography, Grid, TextField, Button, CardActions } from '@mui/material';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import styles from './NotesArea.module.css';
// import xlsx 
import XLSX from 'xlsx/xlsx.js';

const ItemTypes = {
  CARD: 'card',
};

const DraggableCard = ({id, text, index, moveCard, updateCardText, deleteCard }) => {

  const [isEditing, setIsEditing] = useState(true);
  const [editedText, setEditedText] = useState(text);

  const ref = React.useRef(null);
  const [{ handlerId }, drop] = useDrop({
    accept: ItemTypes.CARD,
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) {
        return;
      }
      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }
      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemTypes.CARD,
    item: () => {
      return { id, index};
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0 : 1;
  drag(drop(ref));


  const handleTextChange = (e) => {
    setEditedText(e.target.value);
    updateCardText(id, e.target.value);
  };


  const handleAppend = (text) => {
    setEditedText(editedText + text);
    updateCardText(id, editedText + text);
  };

  const handleDeleteCard = (e) => {
    deleteCard(id);
  }

  return (
    <div ref={ref} style={{ opacity }} data-handler-id={handlerId}>
      <Card style={{ marginBottom: '10px' }}  >
        <CardContent>
          <Typography variant="h6" fontFamily="Arial" fontWeight="Bold" paddingBottom="10px">Note {id}</Typography>
          {isEditing ? (
            <TextField
              multiline={true}
              rows={6}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { handleAppend(e.dataTransfer.getData('text')) } }
              fullWidth
              focused
              value={editedText}
              onChange={handleTextChange}
              sx={{
                "& .MuiOutlinedInput-root": {
                  color: "#000",
                  fontFamily: "Arial",
                  fontWeight: "bold",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                    borderWidth: "2px",
                  },
                  "&.Mui-focused": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#000",
                      borderWidth: "3px",
                    },
                  },
                  "&:hover:not(.Mui-focused)": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2e2e2e",
                    },
                  },
                },
                "& .MuiInputLabel-outlined": {
                  color: "#2e2e2e",
                  fontWeight: "bold",
                  "&.Mui-focused": {
                    color: "secondary.main",
                    fontWeight: "bold",
                  },
                },
              }}
            />
          ) : (
            <Typography>{text}</Typography>
          )}
        </CardContent>
        
      </Card>
    </div>
  );
};

export default function NotesArea() {

  const [cards, setCards] = useState([
    
  ]);

  const moveCard = (dragIndex, hoverIndex) => {
    const dragCard = cards[dragIndex];
    setCards((prevState) => {
      const updatedCards = [...prevState];
      updatedCards.splice(dragIndex, 1);
      updatedCards.splice(hoverIndex, 0, dragCard);
      // update row and col
      updatedCards.map((card, index) => {
        card.row = Math.floor(index / 3);
        card.col = index % 3;
      });

      return updatedCards;
    });
  };

  const updateCardText = (id, newText) => {
    setCards((prevCards) =>
      prevCards.map((card) => (card.id === id ? { ...card, text: newText } : card))
    );
  };

  const addCard = () => {
    const newCardId = cards.length === 0 ? 1 : Math.max(...cards.map((card) => card.id)) + 1;
    const newRow = Math.floor(cards.length / 3 ); // Assuming 3 columns
    const newCol = cards.length % 3 ;
    setCards((prevCards) => [...prevCards, { id: newCardId, text: '', row: newRow, col: newCol }]);
  };

  const deleteCard = (id) => {
    setCards((prevCards) => prevCards.filter((card) => card.id !== id));

    // update the row and col of the cards after deleting a card 
    setCards((prevCards) => {
      const updatedCards = [...prevCards];
      updatedCards.map((card, index) => {
        card.row = Math.floor(index / 3);
        card.col = index % 3;
      });
      return updatedCards;
    });
  }


  const addCardWithText = (text) => {
    const newCardId = Math.max(...cards.map((card) => card.id)) + 1;
    setCards((prevCards) => [...prevCards, { id: newCardId, text }]);
  };

  const handleDoubleClick = () => {
    // get active element list 
    const activeElement = document.activeElement.classList;
    if (activeElement.contains('MuiInputBase-input')) {
      return;
    }
    addCard();
  }

  const exportNotes = () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      cards.map((card) => ({
        "Notes": card.text,
        "Distance from Top": card.row,
        "Distance from Left": card.col,
        "Distance from Top Left Corner": card.row + card.col
      }))
    );
    XLSX.utils.book_append_sheet(wb, ws, "Notes");
    XLSX.writeFile(wb, "notes.xlsx");
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <Card className={styles.notesArea} onDragOver={(e) => e.preventDefault()} onDoubleClick={handleDoubleClick} >
        <Grid container spacing={2}>
          {cards.map((card, index) => (
            <Grid item xs={4} key={card.id}>
              <DraggableCard
                id={card.id}
                index={index}
                text={card.text}
                moveCard={moveCard}
                updateCardText={updateCardText}
                deleteCard={deleteCard}
              />
            </Grid>
          ))}
        </Grid>
        <CardActions style={{ bottom: 0, right: 0, position: 'absolute' }}>
          <Button onClick={addCard}>Add Note</Button>
          <Button onClick={exportNotes}>Export Notes</Button> {/* Export button */}
        </CardActions>
      </Card>
    </DndProvider>
  );
};
