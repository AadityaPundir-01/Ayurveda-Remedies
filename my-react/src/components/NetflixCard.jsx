import Aaditya from "./Netflix.module.css";
export const Card=({data})=>{
    // console.log(data);
      const {id,name,url,year,cast,genre,description,rating,image}= data;

      const btn_css ={
         backgroundColor: `${rating>=8.5 ? "#7dcea0" : "#f7dc6f"}`,
         fontWeight: "bold",
         color: "black",
        //  cursor: "pointer"    by default ye hota hi h browser pr 
    }  
      const conditionalcss =rating >= 8.5 ? Aaditya.super_hit : Aaditya.average;
    return( 
         
 <li className={Aaditya.card}>

    <div className={Aaditya.image}>
      <img src={image} alt={name} 
      width="50%" height="100%" />
    </div>
<div className={Aaditya["card-content"]}>
    <h2 >Name:{name}</h2>
     <h4 >Genre:{genre.join(", ")}</h4>
   <div className={Aaditya.gap} >
    <h5>Imdb: <span className={`${Aaditya.rating} ${conditionalcss}`}>
      {rating}
      </span>
      </h5> 
    <h5>Year:{year}</h5>
   </div> 
   <p >Cast:{cast.join(", ")}</p>
   <p >description:{description}</p>
    <a href={url} target="_blank">
<button style={btn_css}>Get Started{"  >"}
</button>
</a>
</div>
</li>
 ); };