import series from "../api/seriesData.json"
import {Card} from "../components/NetflixCard"
export const Netflix =()=>{
  return(
  <ul className="grid grid-three-cols">
    {series.map((curElem)=>{
      return(

       <Card key={curElem.id} data={curElem}/>

    )     /* inner fat arrow function return ends here  */
    })    /* map function  ends here  */
    }
    
  </ul>
  )  /* outer fat arrow function return ends here  */
};

